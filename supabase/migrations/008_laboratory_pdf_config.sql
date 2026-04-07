-- Migration 008: Add pdf_config to tt_laboratory for per-lab PDF template data

ALTER TABLE tt_laboratory
  ADD COLUMN IF NOT EXISTS pdf_config JSONB DEFAULT '{}'::jsonb;

-- Populate MVZ Labor Ravensburg
UPDATE tt_laboratory
SET pdf_config = '{
  "header_name": "Labor Gärtner",
  "legal_entity": "MVZ Labor Ravensburg GbR",
  "address_full": "Elisabethenstraße 11 | 88212 Ravensburg",
  "phone": "+49 751 502-0",
  "website": "www.labor-gaertner.de",
  "email": "service@labor-gaertner.de",
  "registry": null,
  "ust_id": null,
  "geschaeftsfuehrer": null,
  "privacy_url": null,
  "befund_email": "support@bin-ich-schon-immun.de"
}'::jsonb
WHERE name ILIKE '%ravensburg%' OR name ILIKE '%gärtner%';
