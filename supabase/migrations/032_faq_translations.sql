-- 1. Add new language-specific columns
ALTER TABLE faq
  ADD COLUMN question_en text,
  ADD COLUMN question_de text,
  ADD COLUMN question_es text,
  ADD COLUMN question_nl text,
  ADD COLUMN question_fr text,
  ADD COLUMN answer_en text,
  ADD COLUMN answer_de text,
  ADD COLUMN answer_es text,
  ADD COLUMN answer_nl text,
  ADD COLUMN answer_fr text;

-- 2. Migrate existing data to primary (en) columns
UPDATE faq SET
  question_en = question,
  answer_en = answer;

-- 3. Enforce NOT NULL on primary language columns
ALTER TABLE faq
  ALTER COLUMN question_en SET NOT NULL,
  ALTER COLUMN answer_en SET NOT NULL;

-- 4. Drop the old unified columns
ALTER TABLE faq
  DROP COLUMN question,
  DROP COLUMN answer;
