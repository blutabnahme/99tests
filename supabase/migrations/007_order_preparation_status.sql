-- Migration 007: Add preparation_status jsonb to tt_order
-- Tracks which preparation pipeline steps have completed/failed

ALTER TABLE tt_order
  ADD COLUMN IF NOT EXISTS preparation_status JSONB DEFAULT '{}'::jsonb;

-- Also add columns for generated file URLs
ALTER TABLE tt_order
  ADD COLUMN IF NOT EXISTS anamnese_pdf_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ldt_file_url TEXT,
  ADD COLUMN IF NOT EXISTS pad_pvs_data JSONB DEFAULT '{}'::jsonb;
