import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

export interface TestMaterialEntry {
  material_id: string;
  material_code: string;
  name: string;
  measurement_type: 'volume' | 'quantity';
  // Volume-based fields
  volume: number | null;       // tube capacity
  unit: string | null;         // capacity unit
  required_volume: number | null;
  volume_unit: string | null;
  // Quantity-based fields
  qty: number | null;
}

export interface RecommendationItem {
  test_id: string;
  test_name: string;
  test_sku: string;
  lab_id: string | null;
  materials: TestMaterialEntry[];
}

export interface CalculatedMaterial {
  material_id: string;
  material_code: string;
  material_name: string;
  laboratory_id: string | null;
  measurement_type: 'volume' | 'quantity';
  // Volume-based
  total_required_volume: number | null;
  volume_unit: string | null;
  tube_capacity: number | null;
  calculated_tube_count: number | null;
  // Quantity-based
  total_quantity: number | null;
  // Traceability
  source_tests: { test_id: string; test_name: string; test_sku: string; required_volume?: number; qty?: number }[];
}

// ============================================================
// PURE CALCULATION FUNCTION
// ============================================================

/**
 * calculateMaterials
 * 
 * Takes an array of recommendation items (each with their test catalog data
 * including the materials jsonb array) and returns an aggregated list of
 * materials grouped by (material_id + laboratory_id).
 * 
 * Volume-based materials: sums required_volume, divides by tube capacity, 
 * rounds up to get tube count.
 * 
 * Quantity-based materials: sums qty.
 */
export function calculateMaterials(items: RecommendationItem[]): CalculatedMaterial[] {
  // Composite key: material_id + lab_id
  const aggregation = new Map<string, CalculatedMaterial>();

  for (const item of items) {
    if (!item.materials || !Array.isArray(item.materials)) continue;

    for (const mat of item.materials) {
      if (!mat.material_id) continue;

      const key = `${mat.material_id}__${item.lab_id || 'no-lab'}`;

      if (!aggregation.has(key)) {
        aggregation.set(key, {
          material_id: mat.material_id,
          material_code: mat.material_code || '',
          material_name: mat.name || '',
          laboratory_id: item.lab_id || null,
          measurement_type: mat.measurement_type || 'quantity',
          total_required_volume: null,
          volume_unit: null,
          tube_capacity: null,
          calculated_tube_count: null,
          total_quantity: null,
          source_tests: [],
        });
      }

      const agg = aggregation.get(key)!;

      // Add this test to source_tests for traceability
      const sourceEntry: any = {
        test_id: item.test_id,
        test_name: item.test_name,
        test_sku: item.test_sku,
      };

      if (mat.measurement_type === 'volume') {
        // Volume-based aggregation
        const reqVol = mat.required_volume ?? 0;
        agg.total_required_volume = (agg.total_required_volume ?? 0) + reqVol;
        agg.volume_unit = mat.volume_unit || mat.unit || 'ml';
        agg.tube_capacity = mat.volume ?? null; // tube capacity (same for all entries of this material)
        sourceEntry.required_volume = reqVol;
      } else {
        // Quantity-based aggregation
        const qty = mat.qty ?? 1;
        agg.total_quantity = (agg.total_quantity ?? 0) + qty;
        sourceEntry.qty = qty;
      }

      agg.source_tests.push(sourceEntry);
    }
  }

  // Post-processing: calculate tube counts for volume-based materials
  for (const agg of Array.from(aggregation.values())) {
    if (agg.measurement_type === 'volume' && agg.total_required_volume != null && agg.tube_capacity != null && agg.tube_capacity > 0) {
      agg.calculated_tube_count = Math.ceil(agg.total_required_volume / agg.tube_capacity);
    } else if (agg.measurement_type === 'volume' && agg.total_required_volume != null) {
      // Tube capacity unknown — can't compute count, flag it
      agg.calculated_tube_count = null; // admin will need to check
    }
  }

  return Array.from(aggregation.values());
}

// ============================================================
// PERSISTENCE FUNCTION
// ============================================================

/**
 * saveRecommendationMaterials
 * 
 * Deletes any existing calculated materials for the recommendation,
 * then inserts the new calculated set. This ensures recalculation
 * on edit works cleanly (delete + reinsert).
 */
export async function saveRecommendationMaterials(
  recommendationId: string,
  materials: CalculatedMaterial[]
): Promise<{ success: boolean; error?: string }> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Delete existing entries for this recommendation
    const { error: deleteError } = await supabaseAdmin
      .from('tt_recommendation_material')
      .delete()
      .eq('recommendation_id', recommendationId);

    if (deleteError) throw deleteError;

    // 2. Skip insert if no materials
    if (materials.length === 0) {
      return { success: true };
    }

    // 3. Insert new calculated materials
    const rows = materials.map(m => ({
      recommendation_id: recommendationId,
      material_id: m.material_id,
      laboratory_id: m.laboratory_id,
      measurement_type: m.measurement_type,
      total_required_volume: m.total_required_volume,
      volume_unit: m.volume_unit,
      tube_capacity: m.tube_capacity,
      calculated_tube_count: m.calculated_tube_count,
      total_quantity: m.total_quantity,
      source_tests: m.source_tests,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('tt_recommendation_material')
      .insert(rows);

    if (insertError) throw insertError;

    return { success: true };
  } catch (err: any) {
    console.error('saveRecommendationMaterials error:', err);
    return { success: false, error: err.message };
  }
}
