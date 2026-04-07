-- ============================================================
-- Add ldt_file_url and tif_file_url to tt_order
-- ============================================================

ALTER TABLE tt_order ADD COLUMN IF NOT EXISTS ldt_file_url text;
COMMENT ON COLUMN tt_order.ldt_file_url IS 'URL to generated LDT export';

ALTER TABLE tt_order ADD COLUMN IF NOT EXISTS tif_file_url text;
COMMENT ON COLUMN tt_order.tif_file_url IS 'URL to TIFF companion document for lab';
