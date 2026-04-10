-- ============================================================
-- 019: SHIPMENT OUTBOUND (KIT TO PATIENT) TRACKING
-- ============================================================

-- Outbound leg: kit shipped from 99Tests to patient (always DHL)
ALTER TABLE tt_order_shipment 
  ADD COLUMN IF NOT EXISTS outbound_tracking_number text,
  ADD COLUMN IF NOT EXISTS outbound_tracking_url text,
  ADD COLUMN IF NOT EXISTS outbound_label_url text,
  ADD COLUMN IF NOT EXISTS outbound_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS outbound_shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS outbound_delivered_at timestamptz;

COMMENT ON COLUMN tt_order_shipment.outbound_tracking_number IS 'DHL tracking number for kit shipment TO patient';
COMMENT ON COLUMN tt_order_shipment.outbound_label_url IS 'DHL shipping label PDF URL for outbound kit';
COMMENT ON COLUMN tt_order_shipment.outbound_status IS 'pending → shipped → in_transit → delivered';
COMMENT ON COLUMN tt_order_shipment.outbound_shipped_at IS 'When the kit was shipped to the patient';

-- Rename existing status-related comments for clarity (return leg)
COMMENT ON COLUMN tt_order_shipment.status IS 'Return leg status: sample from patient back to lab';
COMMENT ON COLUMN tt_order_shipment.tracking_number IS 'Return leg tracking number (DHL or GoLogistik HWB)';
COMMENT ON COLUMN tt_order_shipment.shipped_at IS 'When the return sample was shipped/collected';
COMMENT ON COLUMN tt_order_shipment.delivered_at IS 'When the lab received the sample';
