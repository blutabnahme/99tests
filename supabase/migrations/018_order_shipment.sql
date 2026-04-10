-- ============================================================
-- 018: ORDER SHIPMENT TRACKING
-- ============================================================

-- Shipping method enum
CREATE TYPE tt_shipping_method AS ENUM (
  'standard',
  'gologistik'
);

-- Shipment status enum
-- Standard flow:    label_created → patient_sent → in_transit → delivered
-- GoLogistik flow:  awaiting_schedule → scheduled → collected → in_transit → delivered
-- Shared:           cancelled, failed
CREATE TYPE tt_shipment_status AS ENUM (
  'pending',
  'label_created',
  'awaiting_schedule',
  'scheduled',
  'patient_sent',
  'collected',
  'in_transit',
  'delivered',
  'cancelled',
  'failed'
);

-- Core shipment table: one row per lab per order
CREATE TABLE tt_order_shipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES tt_order(id) ON DELETE CASCADE,
  laboratory_id uuid NOT NULL REFERENCES tt_laboratory(id),
  
  -- Shipping config
  shipping_method tt_shipping_method NOT NULL DEFAULT 'standard',
  status tt_shipment_status NOT NULL DEFAULT 'pending',
  
  -- Standard (DHL) fields
  tracking_number text,
  tracking_url text,
  return_label_url text,
  
  -- GoLogistik fields
  gologistik_hwb text,
  gologistik_pickup_date date,
  gologistik_pickup_timeslot text,
  gologistik_delivery_date date,
  gologistik_booking_data jsonb DEFAULT '{}',
  
  -- Materials included in this shipment (derived from calculated_materials for this lab)
  materials jsonb DEFAULT '[]',
  
  -- Tests included in this shipment
  tests jsonb DEFAULT '[]',
  
  -- Timestamps
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one shipment per lab per order
  CONSTRAINT uq_order_lab_shipment UNIQUE (order_id, laboratory_id)
);

CREATE INDEX idx_shipment_order ON tt_order_shipment(order_id);
CREATE INDEX idx_shipment_status ON tt_order_shipment(status);
CREATE INDEX idx_shipment_lab ON tt_order_shipment(laboratory_id);
CREATE INDEX idx_shipment_method ON tt_order_shipment(shipping_method);

COMMENT ON TABLE tt_order_shipment IS 'Tracks individual shipments per lab per order. One order can have multiple shipments (one per lab).';
COMMENT ON COLUMN tt_order_shipment.shipping_method IS 'standard = DHL pre-paid return label, gologistik = GoLogistik courier pickup';
COMMENT ON COLUMN tt_order_shipment.gologistik_hwb IS 'HWB number returned by GoLogistik API (also used as tracking number)';
COMMENT ON COLUMN tt_order_shipment.materials IS 'JSON array of materials in this shipment [{material_name, material_code, tube_count}]';
COMMENT ON COLUMN tt_order_shipment.tests IS 'JSON array of tests in this shipment [{test_id, test_name, test_sku}]';

-- ============================================================
-- FUNCTION: Derive order status from shipments
-- ============================================================
-- This function can be called to recalculate the order's status
-- based on the worst-case shipment status.
-- 
-- Priority (worst to best):
-- pending/failed → preparing
-- label_created/awaiting_schedule → preparing  
-- scheduled/patient_sent → kit_shipped
-- collected/in_transit → returning_to_lab
-- delivered → at_lab
-- 
-- If ALL shipments are delivered → at_lab
-- If ANY shipment is still preparing → preparing

CREATE OR REPLACE FUNCTION fn_derive_order_status(p_order_id uuid)
RETURNS text AS $$
DECLARE
  v_total integer;
  v_delivered integer;
  v_in_transit integer;
  v_shipped integer;
  v_has_failed boolean;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'delivered'),
    COUNT(*) FILTER (WHERE status IN ('collected', 'in_transit')),
    COUNT(*) FILTER (WHERE status IN ('scheduled', 'patient_sent', 'label_created')),
    bool_or(status = 'failed')
  INTO v_total, v_delivered, v_in_transit, v_shipped, v_has_failed
  FROM tt_order_shipment
  WHERE order_id = p_order_id AND status != 'cancelled';

  -- No shipments yet
  IF v_total = 0 THEN RETURN 'preparing'; END IF;
  
  -- All delivered
  IF v_delivered = v_total THEN RETURN 'at_lab'; END IF;
  
  -- Any in transit
  IF v_in_transit > 0 THEN RETURN 'returning_to_lab'; END IF;
  
  -- Any shipped/scheduled
  IF v_shipped > 0 THEN RETURN 'kit_shipped'; END IF;
  
  -- Default: still preparing
  RETURN 'preparing';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_derive_order_status IS 'Calculates order status from worst-case shipment. Call after shipment status changes.';
