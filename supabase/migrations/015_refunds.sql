-- Create the refund tracking table
CREATE TABLE refund (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payment(id) ON DELETE RESTRICT,
  amount numeric(10,2) NOT NULL,
  reason text,
  initiated_by text NOT NULL CHECK (initiated_by IN ('patient', 'bc', 'admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_refund_payment_id ON refund(payment_id);
CREATE INDEX idx_refund_status ON refund(status);

-- Enable RLS
ALTER TABLE refund ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Admins have full access to refunds" 
  ON refund FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Patients can view their refunds"
  ON refund FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payment
      JOIN "case" ON "case".id = payment.case_id
      JOIN patient ON patient.id = "case".patient_id
      WHERE payment.id = refund.payment_id
      AND auth.uid() = patient.id
    )
  );

CREATE POLICY "BCs can view their related refunds"
  ON refund FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payment
      JOIN appointment ON appointment.id = payment.appointment_id
      WHERE payment.id = refund.payment_id
      AND auth.uid() = appointment.bc_id
    )
  );
