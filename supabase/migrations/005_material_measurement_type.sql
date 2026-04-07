-- Migration 005: Add measurement_type to tt_material
-- This distinguishes volume-based materials (tubes) from quantity-based materials (swabs, kits)

-- Create the enum type
CREATE TYPE tt_measurement_type AS ENUM ('volume', 'quantity');

-- Add measurement_type column with default 'quantity' (safe default for existing records)
ALTER TABLE tt_material
  ADD COLUMN measurement_type tt_measurement_type NOT NULL DEFAULT 'quantity';

-- For existing materials that have a default_volume set, they're likely tubes — update them
UPDATE tt_material
  SET measurement_type = 'volume'
  WHERE default_volume IS NOT NULL AND default_volume > 0;
