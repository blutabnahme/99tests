-- Patient magic link tokens
CREATE TABLE IF NOT EXISTS tt_patient_session_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES tt_patient(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  channel VARCHAR(20) NOT NULL DEFAULT 'email', -- 'email', 'sms', 'whatsapp'
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_session_token_token ON tt_patient_session_token(token);
CREATE INDEX idx_patient_session_token_patient ON tt_patient_session_token(patient_id);

-- Patient active sessions
CREATE TABLE IF NOT EXISTS tt_patient_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES tt_patient(id) ON DELETE CASCADE,
  session_token VARCHAR(128) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_session_token_lookup ON tt_patient_session(session_token);
CREATE INDEX idx_patient_session_patient ON tt_patient_session(patient_id);
