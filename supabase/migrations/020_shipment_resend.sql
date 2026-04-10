ALTER TABLE tt_order_shipment 
  ADD COLUMN IF NOT EXISTS resend_id uuid REFERENCES tt_order_resend(id),
  DROP CONSTRAINT IF EXISTS uq_order_lab_shipment;

-- Allow multiple shipments per lab per order (original + resends)
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_lab_resend_shipment 
  ON tt_order_shipment(order_id, laboratory_id, COALESCE(resend_id, '00000000-0000-0000-0000-000000000000'));

COMMENT ON COLUMN tt_order_shipment.resend_id IS 'If set, this shipment is for a resend. NULL = original shipment.';
