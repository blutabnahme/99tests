-- Migration 006: Create tt_recommendation_material table
-- Stores the calculated material requirements per recommendation, grouped by lab

CREATE TABLE tt_recommendation_material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES tt_recommendation(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES tt_material(id),
  laboratory_id UUID REFERENCES tt_laboratory(id),

  -- What the calculator computed
  measurement_type TEXT NOT NULL DEFAULT 'quantity',  -- 'volume' or 'quantity'
  
  -- Volume-based results
  total_required_volume NUMERIC(10,2),      -- sum of required_volume across all tests needing this material at this lab
  volume_unit TEXT,                          -- ml, µl, g
  tube_capacity NUMERIC(10,2),              -- the tube's default_volume (copied for reference)
  calculated_tube_count INT,                -- CEIL(total_required_volume / tube_capacity)

  -- Quantity-based results  
  total_quantity INT,                        -- sum of qty across all tests needing this material at this lab

  -- Metadata
  source_tests JSONB DEFAULT '[]',          -- array of {test_id, test_name, test_sku, required_volume?, qty?} for traceability
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- A recommendation can only have one entry per material per lab
  UNIQUE(recommendation_id, material_id, laboratory_id)
);

-- Index for fast lookups by recommendation
CREATE INDEX idx_rec_material_recommendation ON tt_recommendation_material(recommendation_id);
