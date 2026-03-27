ALTER TABLE blood_collector ADD COLUMN offers_home_visits boolean NOT NULL DEFAULT false;
ALTER TABLE blood_collector ADD COLUMN offers_practice_visits boolean NOT NULL DEFAULT true;
ALTER TABLE blood_collector ADD COLUMN notification_preferences jsonb DEFAULT '{}';
UPDATE blood_collector SET offers_home_visits = true WHERE home_visit_fee > 0;
