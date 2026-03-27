ALTER TABLE healthcare_company ADD COLUMN rejection_reason text;
ALTER TABLE healthcare_company ADD COLUMN rejected_at timestamp with time zone;
ALTER TABLE blood_collector ADD COLUMN rejection_reason text;
ALTER TABLE blood_collector ADD COLUMN rejected_at timestamp with time zone;
