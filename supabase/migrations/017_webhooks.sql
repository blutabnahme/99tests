-- Add Webhook fields to healthcare_company
ALTER TABLE healthcare_company
ADD COLUMN webhook_url text,
ADD COLUMN webhook_secret text;

-- Create webhook_log table
CREATE TABLE webhook_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hc_id uuid REFERENCES healthcare_company(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload_summary text NOT NULL,
    response_code integer,
    attempts integer NOT NULL DEFAULT 0,
    delivered_at timestamptz,
    failed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies for webhook_log
ALTER TABLE webhook_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HCs can view their own webhook logs"
ON webhook_log FOR SELECT
TO authenticated
USING (
  hc_id IN (
    SELECT id FROM healthcare_company
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all webhook logs"
ON webhook_log FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);
