-- Migration 009: Add PAD export tracking fields to tt_order

ALTER TABLE tt_order
  ADD COLUMN IF NOT EXISTS pad_export_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pad_exported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pad_export_batch_id TEXT;

-- Add export counter to service config
ALTER TABLE tt_service_config
  ADD COLUMN IF NOT EXISTS pad_export_counter INTEGER DEFAULT 0;

UPDATE tt_service_config 
SET pad_export_counter = 0 
WHERE pad_export_counter IS NULL;
