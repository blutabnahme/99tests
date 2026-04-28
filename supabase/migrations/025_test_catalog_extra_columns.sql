-- ============================================================
-- Migration 025: Extra Test Catalog Columns
-- Adds proper columns for fields imported via XLS into name_translations._meta
-- ============================================================

-- Add new columns
ALTER TABLE tt_test_catalog ADD COLUMN IF NOT EXISTS method text;
ALTER TABLE tt_test_catalog ADD COLUMN IF NOT EXISTS anamnese_type text;
ALTER TABLE tt_test_catalog ADD COLUMN IF NOT EXISTS test_kit text;
ALTER TABLE tt_test_catalog ADD COLUMN IF NOT EXISTS included_parameters_text text;
ALTER TABLE tt_test_catalog ADD COLUMN IF NOT EXISTS anamnese_parameters text;

COMMENT ON COLUMN tt_test_catalog.method IS 'Lab analysis method';
COMMENT ON COLUMN tt_test_catalog.anamnese_type IS 'Anamnese document type: blood, blood_genetic_consent, urine, stool, other';
COMMENT ON COLUMN tt_test_catalog.test_kit IS 'GoLogistik kit description';
COMMENT ON COLUMN tt_test_catalog.included_parameters_text IS 'Profile: parameter names for catalog display';
COMMENT ON COLUMN tt_test_catalog.anamnese_parameters IS 'Parameter names for anamnese document generation';

-- Migrate data from name_translations._meta into new columns
UPDATE tt_test_catalog
SET
  method = name_translations->'_meta'->>'method',
  anamnese_type = name_translations->'_meta'->>'anamnese_type_biovis',
  test_kit = name_translations->'_meta'->>'test_kit',
  included_parameters_text = name_translations->'_meta'->>'included_parameters_text',
  anamnese_parameters = name_translations->'_meta'->>'anamnese_parameters'
WHERE name_translations ? '_meta';

-- Clean up: remove _meta key from name_translations
UPDATE tt_test_catalog
SET name_translations = name_translations - '_meta'
WHERE name_translations ? '_meta';

-- Verification
SELECT
  COUNT(*) as total,
  COUNT(method) as has_method,
  COUNT(anamnese_type) as has_anamnese_type,
  COUNT(test_kit) as has_test_kit,
  COUNT(included_parameters_text) as has_included_params,
  COUNT(anamnese_parameters) as has_anamnese_params
FROM tt_test_catalog;
