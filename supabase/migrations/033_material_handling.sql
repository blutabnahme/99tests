-- Migration: Add handling requirements to material_catalog

ALTER TABLE material_catalog
ADD COLUMN requires_centrifuge BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN requires_refrigeration BOOLEAN NOT NULL DEFAULT false;

-- Common tubes that require centrifuge
UPDATE material_catalog SET requires_centrifuge = true WHERE name ILIKE '%serum%';
UPDATE material_catalog SET requires_centrifuge = true WHERE name ILIKE '%SST%';
UPDATE material_catalog SET requires_centrifuge = true WHERE name ILIKE '%gel%';

-- Common tubes that require refrigeration
UPDATE material_catalog SET requires_refrigeration = true WHERE name ILIKE '%plasma%';
UPDATE material_catalog SET requires_refrigeration = true WHERE name ILIKE '%citrate%';
