-- Webhook configuration per doctor
CREATE TABLE IF NOT EXISTS tt_webhook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES tt_doctor(id) ON DELETE CASCADE,
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT false,
  events TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- API keys per doctor
CREATE TABLE IF NOT EXISTS tt_api_key (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES tt_doctor(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  label TEXT DEFAULT 'Default',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS tt_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES tt_webhook(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_webhook_doctor ON tt_webhook(doctor_id);
CREATE INDEX IF NOT EXISTS idx_api_key_doctor ON tt_api_key(doctor_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_webhook ON tt_webhook_log(webhook_id);
