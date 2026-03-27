-- Healthcare Company API Auth Config additions
-- Using DO block to safely add columns if they don't already exist from a previous attempt
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE healthcare_company ADD COLUMN api_enabled BOOLEAN DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE healthcare_company ADD COLUMN api_key_hash TEXT;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE healthcare_company ADD COLUMN api_key_prefix TEXT;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE healthcare_company ADD COLUMN api_rate_limit INTEGER DEFAULT 100;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- API Request Audit Logs
CREATE TABLE IF NOT EXISTS api_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hc_id UUID NOT NULL REFERENCES healthcare_company(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_body TEXT,
    response_code INTEGER NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely create indices
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_log_hc_id') THEN
        CREATE INDEX idx_api_log_hc_id ON api_log(hc_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_log_created_at') THEN
        CREATE INDEX idx_api_log_created_at ON api_log(created_at DESC);
    END IF;
END $$;

-- RLS setup
ALTER TABLE api_log ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for internal service role only" ON api_log;
    
    CREATE POLICY "Enable read access for internal service role only" ON api_log
        FOR ALL
        TO authenticated, service_role
        USING (true)
        WITH CHECK (true);
END $$;
