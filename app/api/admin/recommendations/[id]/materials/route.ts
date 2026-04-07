export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { calculateMaterials, saveRecommendationMaterials } from '@/lib/materials-calculator';

// GET — Fetch calculated materials for a recommendation
export async function GET(request: Request, context: any) {
  const { params } = context;
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch calculated materials with material details
    const { data, error } = await supabaseAdmin
      .from('tt_recommendation_material')
      .select(`
        *,
        material:material_id(id, code, name, tube_type, tube_color, default_volume, default_unit, measurement_type),
        laboratory:laboratory_id(id, name)
      `)
      .eq('recommendation_id', params.id)
      .order('laboratory_id', { ascending: true })
      .order('measurement_type', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      recommendation_id: params.id,
      materials: data || [],
      total_items: data?.length || 0,
    });
  } catch (error: any) {
    console.error('GET recommendation materials error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — Trigger materials calculation for a recommendation
export async function POST(request: Request, context: any) {
  const { params } = context;
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify the recommendation exists
    const { data: recommendation, error: recError } = await supabaseAdmin
      .from('tt_recommendation')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (recError || !recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // 2. Fetch all recommendation items
    const { data: recItems, error: itemsError } = await supabaseAdmin
      .from('tt_recommendation_item')
      .select('id, test_id, quantity, lab_id')
      .eq('recommendation_id', params.id);

    if (itemsError) throw itemsError;

    if (!recItems || recItems.length === 0) {
      // No items — clear any existing materials and return empty
      await saveRecommendationMaterials(params.id, []);
      return NextResponse.json({
        recommendation_id: params.id,
        materials: [],
        message: 'No items in recommendation — materials cleared',
      });
    }

    // 3. Fetch the test catalog data for each item (we need the materials jsonb)
    const testIds = recItems.map(item => item.test_id).filter(Boolean);
    const { data: testCatalog, error: catalogError } = await supabaseAdmin
      .from('tt_test_catalog')
      .select('id, sku, name, lab_id, materials')
      .in('id', testIds);

    if (catalogError) throw catalogError;

    // Build a map for quick lookup
    const catalogMap = new Map((testCatalog || []).map(t => [t.id, t]));

    // 4. Build the items array for the calculator
    const calculatorItems = recItems.map(item => {
      const catalogEntry = catalogMap.get(item.test_id);
      return {
        test_id: item.test_id || '',
        test_name: catalogEntry?.name || 'Unknown Test',
        test_sku: catalogEntry?.sku || '',
        lab_id: item.lab_id || catalogEntry?.lab_id || null,
        materials: Array.isArray(catalogEntry?.materials) ? catalogEntry.materials : [],
      };
    });

    // 5. Run the calculator
    const calculatedMaterials = calculateMaterials(calculatorItems);

    // 6. Persist results
    const result = await saveRecommendationMaterials(params.id, calculatedMaterials);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to save materials' }, { status: 500 });
    }

    // 7. Return the calculated results
    return NextResponse.json({
      recommendation_id: params.id,
      materials: calculatedMaterials,
      total_items: calculatedMaterials.length,
      message: 'Materials calculated and saved successfully',
    });
  } catch (error: any) {
    console.error('POST recommendation materials error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
