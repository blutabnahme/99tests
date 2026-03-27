-- API keys table
CREATE TABLE IF NOT EXISTS api_key (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hc_id uuid NOT NULL REFERENCES healthcare_company(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  last_used_at timestamptz,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  revoked_at timestamptz
);

-- Indexes
CREATE INDEX idx_api_key_hc ON api_key(hc_id);
CREATE INDEX idx_api_key_hash ON api_key(key_hash);
CREATE UNIQUE INDEX idx_api_key_prefix ON api_key(key_prefix);
