-- Step 1 — Add new columns:
ALTER TABLE blood_collector ADD COLUMN practice_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE blood_collector ADD COLUMN home_visit_fee numeric NOT NULL DEFAULT 0;

-- Step 2 — Migrate existing data:
UPDATE blood_collector SET practice_fee = base_fee, home_visit_fee = base_fee;

-- Step 3 — Fix Anna Weber specifically:
UPDATE blood_collector SET practice_fee = 25.00, home_visit_fee = 35.00, travel_fee_per_km = 1.50 WHERE id = 'f105dc5f-7a00-4bc8-9fb8-71ae834bb93c';

-- Step 4 — Drop old column:
ALTER TABLE blood_collector DROP COLUMN base_fee;
