-- ============================================================
-- 016: ORDER RESEND TRACKING
-- ============================================================

-- Enum for resend reasons
CREATE TYPE tt_resend_reason AS ENUM (
  'hemolyzed_sample',
  'insufficient_volume', 
  'damaged_in_transit',
  'lost_in_transit',
  'lab_processing_error',
  'expired_sample',
  'contaminated_sample',
  'wrong_material',
  'patient_error',
  'other'
);

-- Enum for resend status
CREATE TYPE tt_resend_status AS ENUM (
  'created',
  'shipped',
  'received',
  'cancelled'
);

-- Resend tracking table
CREATE TABLE tt_order_resend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES tt_order(id) ON DELETE CASCADE,
  reason tt_resend_reason NOT NULL,
  notes text,
  materials jsonb DEFAULT '[]',
  new_dhl_tracking text,
  new_dhl_label_url text,
  status tt_resend_status DEFAULT 'created',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  shipped_at timestamptz,
  received_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_order_resend_order ON tt_order_resend(order_id);
CREATE INDEX idx_order_resend_status ON tt_order_resend(status);

COMMENT ON TABLE tt_order_resend IS 'Tracks kit resends when lab reports sample problems';
COMMENT ON COLUMN tt_order_resend.materials IS 'JSON array of materials being resent [{material_name, material_code, tube_count}]';
COMMENT ON COLUMN tt_order_resend.created_by IS 'Admin user who initiated the resend';

-- Add resend_count to tt_order for quick reference
ALTER TABLE tt_order ADD COLUMN IF NOT EXISTS resend_count integer DEFAULT 0;
COMMENT ON COLUMN tt_order.resend_count IS 'Number of times this order has been resent';

-- Trigger to auto-increment resend_count
CREATE OR REPLACE FUNCTION fn_increment_resend_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tt_order SET resend_count = resend_count + 1, updated_at = now()
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_resend_count
  AFTER INSERT ON tt_order_resend
  FOR EACH ROW
  EXECUTE FUNCTION fn_increment_resend_count();
