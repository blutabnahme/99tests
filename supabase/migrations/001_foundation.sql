-- ============================================================
-- 99Tests 2.0 — Migration 001: Foundation Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE tt_test_type AS ENUM ('parameter', 'profile');

CREATE TYPE tt_sample_shipping AS ENUM ('standard', 'prio', 'express', 'gologistik');

CREATE TYPE tt_gender AS ENUM ('M', 'W', 'D');

CREATE TYPE tt_recommendation_status AS ENUM (
  'created',
  'sent',
  'paid',
  'expired',
  'cancelled'
);

CREATE TYPE tt_order_status AS ENUM (
  'preparing',
  'kit_shipped',
  'collection_organized',
  'awaiting_collection',
  'returning_to_lab',
  'at_lab',
  'results_ready',
  'completed',
  'cancelled'
);

CREATE TYPE tt_result_status AS ENUM ('pending', 'processing', 'completed');

CREATE TYPE tt_export_type AS ENUM ('ldt', 'pad', 'anamnese_pdf', 'webhook', 'dhl_label');

CREATE TYPE tt_delivery_status AS ENUM ('success', 'failed', 'pending_retry');

CREATE TYPE tt_collection_preference AS ENUM ('self', 'home_visit', 'practice', 'undecided');

CREATE TYPE tt_results_delivery AS ENUM ('doctor_and_patient', 'doctor_only', 'patient_only');

CREATE TYPE tt_insured_status AS ENUM ('privat_versichert', 'selbstzahler', 'gesetzlich');

CREATE TYPE tt_pricing_tier AS ENUM ('insured', 'uninsured', 'zone1', 'zone2', 'zone3');

CREATE TYPE tt_team_role AS ENUM ('admin', 'doctor', 'viewer');

CREATE TYPE tt_team_member_status AS ENUM ('active', 'invited', 'deactivated');


-- ============================================================
-- 2. LABORATORY
-- ============================================================

CREATE TABLE tt_laboratory (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  official_name text,
  practice_name text,
  slug          text UNIQUE,
  address_street text,
  address_zip   text,
  address_city  text,
  address_country text DEFAULT 'D',
  contact_email text,
  contact_phone text,
  aisid         text,
  customer_number text,
  ldt_config    jsonb DEFAULT '{}',
  pad_config    jsonb DEFAULT '{}',
  capabilities  text[] DEFAULT '{}',
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

COMMENT ON TABLE tt_laboratory IS 'Partner laboratories that perform tests';
COMMENT ON COLUMN tt_laboratory.aisid IS 'PAD system identifier for this lab';
COMMENT ON COLUMN tt_laboratory.ldt_config IS 'LDT-specific settings: {einsender_id, charset, version}';
COMMENT ON COLUMN tt_laboratory.pad_config IS 'PAD-specific settings';


-- ============================================================
-- 3. TEST CATALOG
-- ============================================================

CREATE TABLE tt_test_catalog (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                  text UNIQUE NOT NULL,
  name                 text NOT NULL,
  name_translations    jsonb DEFAULT '{}',
  type                 tt_test_type NOT NULL,
  category             text,
  lab_id               uuid REFERENCES tt_laboratory(id) ON DELETE SET NULL,
  lab_cost             decimal(10,2),
  price_insured        decimal(10,2),
  price_uninsured      decimal(10,2),
  price_zone1          decimal(10,2),
  price_zone2          decimal(10,2),
  price_zone3          decimal(10,2),
  materials            jsonb DEFAULT '[]',
  sample_shipping      tt_sample_shipping DEFAULT 'standard',
  preanalytics         text,
  more_info_url        text,
  edv_code             text,
  goae_digit           text,
  goae_costs           text,
  goae_names           text,
  goae_factor          text,
  included_parameters  uuid[] DEFAULT '{}',
  is_active            boolean DEFAULT true,
  sort_order           integer DEFAULT 0,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX idx_test_catalog_type ON tt_test_catalog(type);
CREATE INDEX idx_test_catalog_category ON tt_test_catalog(category);
CREATE INDEX idx_test_catalog_lab ON tt_test_catalog(lab_id);
CREATE INDEX idx_test_catalog_active ON tt_test_catalog(is_active) WHERE is_active = true;
CREATE INDEX idx_test_catalog_name_search ON tt_test_catalog USING gin(to_tsvector('german', name));

COMMENT ON TABLE tt_test_catalog IS 'Unified catalog for parameters and profiles';
COMMENT ON COLUMN tt_test_catalog.name_translations IS '{de, en, es, nl, fr} translations';
COMMENT ON COLUMN tt_test_catalog.materials IS '[{material_code, name, volume, unit, qty}]';
COMMENT ON COLUMN tt_test_catalog.included_parameters IS 'Profile only: array of parameter UUIDs';
COMMENT ON COLUMN tt_test_catalog.goae_digit IS 'GoÄ billing code(s), e.g. "4288 (2x)"';
COMMENT ON COLUMN tt_test_catalog.goae_costs IS 'Cost per GoÄ code, e.g. "20.40 (2x)"';
COMMENT ON COLUMN tt_test_catalog.goae_factor IS 'GoÄ multiplier factor';


-- ============================================================
-- 4. DOCTOR
-- ============================================================

CREATE TABLE tt_doctor (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE,
  practice_name   text,
  specialty       text,
  license_number  text,
  full_name       text,
  email           text,
  phone           text,
  address_street  text,
  address_zip     text,
  address_city    text,
  address_country text DEFAULT 'D',
  language        text DEFAULT 'de',
  is_verified     boolean DEFAULT false,
  is_active       boolean DEFAULT true,
  custom_service_fee_pct decimal(5,2),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_doctor_user ON tt_doctor(user_id);
CREATE INDEX idx_doctor_email ON tt_doctor(email);

COMMENT ON TABLE tt_doctor IS 'Doctor profiles — linked to auth.users via user_id';
COMMENT ON COLUMN tt_doctor.license_number IS 'Arztnummer';
COMMENT ON COLUMN tt_doctor.custom_service_fee_pct IS 'Per-doctor override — if set, used instead of global service_fee_pct from tt_service_config';


-- ============================================================
-- 5. DOCTOR TEAM
-- ============================================================

CREATE TABLE tt_team_member (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   uuid NOT NULL REFERENCES tt_doctor(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  role        tt_team_role DEFAULT 'doctor',
  user_id     uuid,
  status      tt_team_member_status DEFAULT 'invited',
  invited_by  uuid REFERENCES tt_doctor(id),
  invited_at  timestamptz DEFAULT now(),
  joined_at   timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_team_member_unique 
  ON tt_team_member(doctor_id, email) 
  WHERE status != 'deactivated';

COMMENT ON TABLE tt_team_member IS 'Practice team members — doctors can invite colleagues';


-- ============================================================
-- 6. PATIENT
-- ============================================================

CREATE TABLE tt_patient (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id             uuid REFERENCES tt_doctor(id) ON DELETE SET NULL,
  salutation            text,
  first_name            text NOT NULL,
  last_name             text NOT NULL,
  email                 text,
  phone                 text,
  gender                tt_gender,
  date_of_birth         date NOT NULL,
  is_minor              boolean DEFAULT false,
  guardian_salutation   text,
  guardian_first_name   text,
  guardian_last_name    text,
  address_line1         text,
  address_line2         text,
  address_city          text,
  address_state         text,
  address_zip           text,
  address_country       text DEFAULT 'D',
  insured_status        tt_insured_status,
  family_doctor         text,
  observations          text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_patient_doctor ON tt_patient(doctor_id);
CREATE INDEX idx_patient_email ON tt_patient(email);
CREATE INDEX idx_patient_name ON tt_patient(last_name, first_name);

COMMENT ON TABLE tt_patient IS 'Patients registered by doctors';
COMMENT ON COLUMN tt_patient.address_country IS 'Used for pricing tier detection';
COMMENT ON COLUMN tt_patient.insured_status IS 'Determines pricing: PKV, Selbstzahler, or Gesetzlich';


-- ============================================================
-- 7. RECOMMENDATION
-- ============================================================

CREATE TABLE tt_recommendation (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id                text UNIQUE,
  doctor_id                 uuid NOT NULL REFERENCES tt_doctor(id),
  patient_id                uuid NOT NULL REFERENCES tt_patient(id),
  status                    tt_recommendation_status DEFAULT 'created',
  pricing_tier              tt_pricing_tier,
  collection_preference     tt_collection_preference DEFAULT 'undecided',
  results_delivery          tt_results_delivery DEFAULT 'doctor_and_patient',
  anamnese_notes            text,
  internal_notes            text,
  expected_appointment_date date,
  hematch_case_id           uuid,
  created_at                timestamptz DEFAULT now(),
  sent_at                   timestamptz,
  paid_at                   timestamptz,
  completed_at              timestamptz
);

CREATE INDEX idx_recommendation_doctor ON tt_recommendation(doctor_id);
CREATE INDEX idx_recommendation_patient ON tt_recommendation(patient_id);
CREATE INDEX idx_recommendation_status ON tt_recommendation(status);
CREATE INDEX idx_recommendation_display ON tt_recommendation(display_id);

COMMENT ON TABLE tt_recommendation IS 'Doctor recommendations to patients';
COMMENT ON COLUMN tt_recommendation.display_id IS 'Human-readable ID, e.g. R-00558';
COMMENT ON COLUMN tt_recommendation.hematch_case_id IS 'If blood collection via Hematch, stores the Hematch case UUID';


-- ============================================================
-- 8. RECOMMENDATION ITEM
-- ============================================================

CREATE TABLE tt_recommendation_item (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES tt_recommendation(id) ON DELETE CASCADE,
  test_id           uuid NOT NULL REFERENCES tt_test_catalog(id),
  test_type         tt_test_type NOT NULL,
  quantity          integer DEFAULT 1,
  unit_price        decimal(10,2),
  lab_cost          decimal(10,2),
  lab_id            uuid REFERENCES tt_laboratory(id),
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_rec_item_recommendation ON tt_recommendation_item(recommendation_id);
CREATE INDEX idx_rec_item_test ON tt_recommendation_item(test_id);

COMMENT ON TABLE tt_recommendation_item IS 'Individual tests within a recommendation';
COMMENT ON COLUMN tt_recommendation_item.unit_price IS 'Locked at recommendation time from patient pricing tier';
COMMENT ON COLUMN tt_recommendation_item.lab_cost IS 'Locked at recommendation time for margin calculation';


-- ============================================================
-- 9. PAYMENT
-- ============================================================

CREATE TABLE tt_payment (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid REFERENCES tt_recommendation(id),
  provider        text DEFAULT 'mock',
  provider_id     text,
  amount          decimal(10,2) NOT NULL,
  currency        text DEFAULT 'EUR',
  status          text DEFAULT 'pending',
  paid_at         timestamptz,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_payment_recommendation ON tt_payment(recommendation_id);

COMMENT ON TABLE tt_payment IS 'Payment records — mock for MVP, Stripe later';


-- ============================================================
-- 10. ORDER
-- ============================================================

CREATE TABLE tt_order (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id            text UNIQUE,
  recommendation_id     uuid UNIQUE REFERENCES tt_recommendation(id),
  patient_id            uuid REFERENCES tt_patient(id),
  doctor_id             uuid REFERENCES tt_doctor(id),
  status                tt_order_status DEFAULT 'preparing',
  payment_id            uuid REFERENCES tt_payment(id),
  invoice_number        text UNIQUE,
  service_fee_pct       decimal(5,2),
  service_fee_amount    decimal(10,2),
  shipping_method       text,
  shipping_cost         decimal(10,2),
  test_costs_total      decimal(10,2),
  subtotal              decimal(10,2),
  vat_rate              decimal(5,2),
  vat_amount            decimal(10,2),
  total                 decimal(10,2),
  hematch_case_id       uuid,
  dhl_tracking_outbound text,
  dhl_tracking_return   text,
  shipping_address      jsonb,
  billing_address       jsonb,
  created_at            timestamptz DEFAULT now(),
  shipped_at            timestamptz,
  completed_at          timestamptz
);

CREATE INDEX idx_order_recommendation ON tt_order(recommendation_id);
CREATE INDEX idx_order_patient ON tt_order(patient_id);
CREATE INDEX idx_order_doctor ON tt_order(doctor_id);
CREATE INDEX idx_order_status ON tt_order(status);
CREATE INDEX idx_order_invoice ON tt_order(invoice_number);

COMMENT ON TABLE tt_order IS 'Created after patient payment. 1:1 with recommendation.';
COMMENT ON COLUMN tt_order.display_id IS 'Human-readable, e.g. O-00558';
COMMENT ON COLUMN tt_order.vat_amount IS 'VAT on service fee + shipping only (lab costs are VAT-exempt)';


-- ============================================================
-- 11. RESULT
-- ============================================================

CREATE TABLE tt_result (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES tt_order(id) ON DELETE CASCADE,
  lab_id          uuid REFERENCES tt_laboratory(id),
  status          tt_result_status DEFAULT 'pending',
  result_pdf_url  text,
  received_at     timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_result_order ON tt_result(order_id);

COMMENT ON TABLE tt_result IS 'Lab results per order, per lab';


-- ============================================================
-- 12. EXPORT LOG (AUDIT TRAIL)
-- ============================================================

CREATE TABLE tt_export_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid REFERENCES tt_order(id),
  export_type   tt_export_type NOT NULL,
  destination   text,
  file_url      text,
  payload_hash  text,
  status        text DEFAULT 'success',
  error_message text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_export_log_order ON tt_export_log(order_id);
CREATE INDEX idx_export_log_type ON tt_export_log(export_type);

COMMENT ON TABLE tt_export_log IS 'Audit trail for all exports: LDT, PAD, Anamnese, webhooks, DHL';


-- ============================================================
-- 13. WEBHOOK SYSTEM
-- ============================================================

CREATE TABLE tt_webhook_subscription (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  url           text NOT NULL,
  api_key       text,
  events        text[] DEFAULT '{}',
  is_active     boolean DEFAULT true,
  retry_policy  jsonb DEFAULT '{"max_retries": 4, "backoff_multiplier": 3, "initial_delay_s": 120}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

COMMENT ON TABLE tt_webhook_subscription IS 'Webhook subscribers — Ceni and partner integrations';

CREATE TABLE tt_webhook_delivery (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id   uuid NOT NULL REFERENCES tt_webhook_subscription(id) ON DELETE CASCADE,
  event_type        text NOT NULL,
  payload           jsonb NOT NULL,
  response_code     integer,
  response_body     text,
  attempt           integer DEFAULT 1,
  status            tt_delivery_status DEFAULT 'pending_retry',
  delivered_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_webhook_delivery_sub ON tt_webhook_delivery(subscription_id);
CREATE INDEX idx_webhook_delivery_status ON tt_webhook_delivery(status);

COMMENT ON TABLE tt_webhook_delivery IS 'Delivery log for every webhook attempt';


-- ============================================================
-- 14. DOCTOR FEATURES
-- ============================================================

-- Favorites
CREATE TABLE tt_doctor_favorite (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   uuid NOT NULL REFERENCES tt_doctor(id) ON DELETE CASCADE,
  test_id     uuid NOT NULL REFERENCES tt_test_catalog(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_doctor_favorite_unique ON tt_doctor_favorite(doctor_id, test_id);

COMMENT ON TABLE tt_doctor_favorite IS 'Tests marked as favorites by doctors';

-- Presets (5 named slots)
CREATE TABLE tt_doctor_preset (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   uuid NOT NULL REFERENCES tt_doctor(id) ON DELETE CASCADE,
  slot_number integer NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
  name        text,
  test_ids    jsonb DEFAULT '[]',
  updated_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_doctor_preset_unique ON tt_doctor_preset(doctor_id, slot_number);

COMMENT ON TABLE tt_doctor_preset IS '5 named preset slots per doctor, each holding test IDs';

-- Smart Templates
CREATE TABLE tt_doctor_template (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id       uuid NOT NULL REFERENCES tt_doctor(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  test_ids        jsonb DEFAULT '[]',
  default_notes   text,
  is_shared       boolean DEFAULT false,
  usage_count     integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_doctor_template_doctor ON tt_doctor_template(doctor_id);

COMMENT ON TABLE tt_doctor_template IS 'Reusable test combinations with clinical context';
COMMENT ON COLUMN tt_doctor_template.default_notes IS 'Pre-filled anamnese notes when template is used';


-- ============================================================
-- 15. API KEYS (for partner startups)
-- ============================================================

CREATE TABLE tt_api_key (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label       text NOT NULL,
  key_hash    text NOT NULL,
  key_prefix  text NOT NULL,
  partner_name text,
  rate_limit  integer DEFAULT 1000,
  is_active   boolean DEFAULT true,
  last_used   timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_api_key_prefix ON tt_api_key(key_prefix);

COMMENT ON TABLE tt_api_key IS 'API keys for partner startups — stored as SHA-256 hash';
COMMENT ON COLUMN tt_api_key.rate_limit IS 'Max requests per hour';

-- API request log
CREATE TABLE tt_api_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id  uuid REFERENCES tt_api_key(id),
  method      text,
  path        text,
  status_code integer,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_api_log_key ON tt_api_log(api_key_id);
CREATE INDEX idx_api_log_created ON tt_api_log(created_at);

COMMENT ON TABLE tt_api_log IS 'Request log for API usage tracking and rate limiting';


-- ============================================================
-- 16. NOTIFICATIONS (reused from Hematch pattern)
-- ============================================================

CREATE TABLE tt_notification_template (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  channel     text NOT NULL DEFAULT 'email',
  subject     text,
  body        text NOT NULL,
  variables   text[] DEFAULT '{}',
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE tt_notification_template IS 'Notification templates for email/SMS/WhatsApp';

CREATE TABLE tt_notification (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,
  type          text NOT NULL,
  title         text,
  message       text,
  link          text,
  is_read       boolean DEFAULT false,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_notification_user ON tt_notification(user_id);
CREATE INDEX idx_notification_read ON tt_notification(user_id, is_read);

CREATE TABLE tt_notification_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key  text,
  channel       text,
  recipient     text,
  status        text DEFAULT 'sent',
  error_message text,
  metadata      jsonb DEFAULT '{}',
  sent_at       timestamptz DEFAULT now()
);

COMMENT ON TABLE tt_notification_log IS 'Delivery tracking for all notification channels';


-- ============================================================
-- 17. PLATFORM CONFIGURATION
-- ============================================================

CREATE TABLE tt_service_config (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_fee_pct       decimal(5,2) DEFAULT 15.00,
  vat_rate              decimal(5,2) DEFAULT 19.00,
  shipping_standard     decimal(10,2) DEFAULT 5.90,
  shipping_prio         decimal(10,2) DEFAULT 9.90,
  shipping_express      decimal(10,2) DEFAULT 14.90,
  shipping_gologistik   decimal(10,2) DEFAULT 23.22,
  country_zone_mapping  jsonb DEFAULT '{}',
  pvs_file_prefix       text DEFAULT 'PV345000',
  pad_export_counter    integer DEFAULT 0,
  updated_at            timestamptz DEFAULT now()
);

COMMENT ON TABLE tt_service_config IS 'Global platform configuration — single row';
COMMENT ON COLUMN tt_service_config.service_fee_pct IS 'Service fee percentage charged to patients';
COMMENT ON COLUMN tt_service_config.vat_rate IS 'VAT rate applied to service fee + shipping only';
COMMENT ON COLUMN tt_service_config.country_zone_mapping IS '{country_code: zone_number} for pricing tier detection';
COMMENT ON COLUMN tt_service_config.pvs_file_prefix IS 'PVS company identifier for PAD filenames';

-- Seed the single config row
INSERT INTO tt_service_config (
  service_fee_pct, vat_rate,
  shipping_standard, shipping_prio, shipping_express, shipping_gologistik,
  pvs_file_prefix, pad_export_counter,
  country_zone_mapping
) VALUES (
  15.00, 19.00,
  5.90, 9.90, 14.90, 23.22,
  'PV345000', 0,
  '{
    "AT": 1, "CH": 1, "LU": 1, "LI": 1, "BE": 1, "NL": 1,
    "FR": 2, "IT": 2, "ES": 2, "PT": 2, "GB": 2, "IE": 2, "DK": 2, "SE": 2, "NO": 2, "FI": 2, "PL": 2, "CZ": 2,
    "US": 3, "CA": 3, "AU": 3, "JP": 3, "BR": 3
  }'::jsonb
);


-- ============================================================
-- 18. FAQ (reused from Hematch pattern)
-- ============================================================

CREATE TABLE tt_faq (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text,
  question    jsonb NOT NULL DEFAULT '{}',
  answer      jsonb NOT NULL DEFAULT '{}',
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE tt_faq IS 'Multilingual FAQ — question/answer stored as {de, en, es, nl, fr}';


-- ============================================================
-- 19. DISPLAY ID GENERATION FUNCTIONS
-- ============================================================

-- Auto-generate recommendation display_id (R-00001, R-00002, ...)
CREATE OR REPLACE FUNCTION tt_generate_recommendation_display_id()
RETURNS trigger AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(display_id FROM 3) AS integer)
  ), 0) + 1 INTO next_num
  FROM tt_recommendation
  WHERE display_id IS NOT NULL AND display_id ~ '^R-\d+$';
  
  NEW.display_id := 'R-' || LPAD(next_num::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recommendation_display_id
  BEFORE INSERT ON tt_recommendation
  FOR EACH ROW
  WHEN (NEW.display_id IS NULL)
  EXECUTE FUNCTION tt_generate_recommendation_display_id();

-- Auto-generate order display_id (O-00001, O-00002, ...)
CREATE OR REPLACE FUNCTION tt_generate_order_display_id()
RETURNS trigger AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(display_id FROM 3) AS integer)
  ), 0) + 1 INTO next_num
  FROM tt_order
  WHERE display_id IS NOT NULL AND display_id ~ '^O-\d+$';
  
  NEW.display_id := 'O-' || LPAD(next_num::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_display_id
  BEFORE INSERT ON tt_order
  FOR EACH ROW
  WHEN (NEW.display_id IS NULL)
  EXECUTE FUNCTION tt_generate_order_display_id();

-- Auto-generate invoice number (A-00001, A-00002, ...)
CREATE OR REPLACE FUNCTION tt_generate_invoice_number()
RETURNS trigger AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 3) AS integer)
  ), 0) + 1 INTO next_num
  FROM tt_order
  WHERE invoice_number IS NOT NULL AND invoice_number ~ '^A-\d+$';
  
  NEW.invoice_number := 'A-' || LPAD(next_num::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_invoice_number
  BEFORE INSERT ON tt_order
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION tt_generate_invoice_number();


-- ============================================================
-- 20. UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION tt_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_laboratory_updated BEFORE UPDATE ON tt_laboratory FOR EACH ROW EXECUTE FUNCTION tt_set_updated_at();
CREATE TRIGGER trg_test_catalog_updated BEFORE UPDATE ON tt_test_catalog FOR EACH ROW EXECUTE FUNCTION tt_set_updated_at();
CREATE TRIGGER trg_doctor_updated BEFORE UPDATE ON tt_doctor FOR EACH ROW EXECUTE FUNCTION tt_set_updated_at();
CREATE TRIGGER trg_patient_updated BEFORE UPDATE ON tt_patient FOR EACH ROW EXECUTE FUNCTION tt_set_updated_at();
CREATE TRIGGER trg_service_config_updated BEFORE UPDATE ON tt_service_config FOR EACH ROW EXECUTE FUNCTION tt_set_updated_at();
CREATE TRIGGER trg_faq_updated BEFORE UPDATE ON tt_faq FOR EACH ROW EXECUTE FUNCTION tt_set_updated_at();
CREATE TRIGGER trg_doctor_template_updated BEFORE UPDATE ON tt_doctor_template FOR EACH ROW EXECUTE FUNCTION tt_set_updated_at();
CREATE TRIGGER trg_webhook_sub_updated BEFORE UPDATE ON tt_webhook_subscription FOR EACH ROW EXECUTE FUNCTION tt_set_updated_at();


-- ============================================================
-- 21. SEED: CENI WEBHOOK SUBSCRIBER
-- ============================================================

INSERT INTO tt_webhook_subscription (name, url, events, retry_policy) VALUES (
  'Ceni Sync',
  'https://webhook.ceni-denes.mk/wordpress/webhook',
  ARRAY['recommendation.paid', 'order.preparing', 'patient.created', 'patient.updated'],
  '{"max_retries": 4, "backoff_multiplier": 3, "initial_delay_s": 120}'::jsonb
);


-- ============================================================
-- 22. SEED: MVZ LABOR RAVENSBURG
-- ============================================================

INSERT INTO tt_laboratory (
  name, official_name, practice_name, slug,
  address_street, address_zip, address_city, address_country,
  aisid, customer_number,
  ldt_config
) VALUES (
  'MVZ Labor Ravensburg',
  'MVZ Labor Ravensburg GmbH',
  'MVZ Labor Ravensburg',
  'mvz-labor-ravensburg',
  '', '', 'Ravensburg', 'D',
  '', '25-997',
  '{
    "einsender_id": "25-997",
    "charset": 4,
    "version": "LDT4.20",
    "profile_category_label": "Profile",
    "filename_prefix": "Z"
  }'::jsonb
);


-- ============================================================
-- DONE
-- ============================================================
-- Migration 001 complete.
-- Tables created: 20
-- Enums created: 14
-- Triggers: display_id auto-generation, updated_at auto-set
-- Seeds: service config, Ceni webhook, MVZ laboratory
-- 
-- Next: Run this in Supabase SQL Editor
-- Then: Save as supabase/migrations/001_foundation.sql in your project
