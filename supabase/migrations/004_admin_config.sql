-- Migration: Add fields to material_catalog and seed platform_config

-- 1. Update material_catalog table
ALTER TABLE material_catalog
ADD COLUMN IF NOT EXISTS type text DEFAULT 'Supply',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Seed platform_config default settings
INSERT INTO platform_config (id, value)
VALUES
  ('pricing', '{
    "urgent_surcharge_pct": 25,
    "emergency_surcharge_pct": 50,
    "special_case_enabled": true,
    "special_case_surcharge_pct": 15,
    "travel_rate_per_km": 0.40,
    "min_bc_fee": 15,
    "max_bc_fee": 100,
    "min_bc_payout": 12.50
  }'),
  ('fees', '{
    "practice_org_fee": 20.00,
    "home_org_fee": 35.00,
    "material_shipping_fee": 8.50,
    "return_shipping_fee": 12.00
  }'),
  ('tax', '{
    "vat_rate_pct": 19
  }'),
  ('commission', '{
    "default_platform_rate_pct": 17.5
  }'),
  ('alerts', '{
    "unmatched_case_hours": 24,
    "scheduling_conflict_attempts": 3,
    "scheduling_conflict_hours": 72,
    "bc_cancellation_threshold_30_days": 3,
    "auto_fallback_enabled": true,
    "auto_fallback_hours": 72,
    "re_verification_alert_days": 30
  }'),
  ('api', '{
    "global_rate_limit_req_min": 100
  }')
ON CONFLICT (id) DO NOTHING;

-- Seed some default materials if empty
INSERT INTO material_catalog (id, name, type, price, is_active)
VALUES
  ('edta_27', 'EDTA Tube (2.7ml)', 'Tube', 0.85, true),
  ('edta_49', 'EDTA Tube (4.9ml)', 'Tube', 0.95, true),
  ('serum_49', 'Serum Tube (4.9ml)', 'Tube', 0.90, true),
  ('lithium_heparin', 'Lithium Heparin Tube', 'Tube', 1.10, true),
  ('citrate_32', 'Citrate Tube (3.2ml)', 'Tube', 1.20, true),
  ('butterfly_21g', 'Butterfly Needle 21G', 'Needle', 0.65, true),
  ('standard_21g', 'Standard Needle 21G', 'Needle', 0.30, true),
  ('alcohol_swab_10', 'Alcohol Swab Pack (10)', 'Supply', 0.50, true),
  ('shipping_ambient', 'Shipping Container (Ambient)', 'Container', 3.50, true),
  ('shipping_cold', 'Shipping Container (Cold Chain)', 'Container', 7.20, true),
  ('ice_pack', 'Ice Pack', 'Accessory', 1.80, false)
ON CONFLICT (id) DO NOTHING;
