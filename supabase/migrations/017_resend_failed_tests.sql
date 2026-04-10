ALTER TABLE tt_order_resend ADD COLUMN IF NOT EXISTS failed_tests jsonb DEFAULT '[]';
COMMENT ON COLUMN tt_order_resend.failed_tests IS 'JSON array of tests that failed [{test_id, test_name, test_sku}]';
