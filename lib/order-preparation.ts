import { createClient } from '@supabase/supabase-js';
import { calculateMaterials, saveRecommendationMaterials } from '@/lib/materials-calculator';
import { generateAnamnese } from '@/lib/anamnese-pdf';
import { generateLdtExport } from '@/lib/ldt-generator';
import { generatePadPvsSnapshot } from '@/lib/pad-pvs-snapshot';

// ============================================================
// TYPES
// ============================================================

interface StepResult {
  status: 'completed' | 'failed' | 'skipped' | 'pending';
  completed_at?: string;
  attempted_at?: string;
  error?: string;
  [key: string]: any; // allow extra metadata per step
}

interface PreparationStatus {
  materials: StepResult;
  anamnese_pdf: StepResult;
  ldt_file: StepResult;
  pad_pvs: StepResult;
  dhl_label: StepResult;
}

// ============================================================
// HELPER: Get Supabase Admin Client
// ============================================================

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// STEP 1: MATERIALS CALCULATOR
// ============================================================

async function stepMaterials(orderId: string, recommendationId: string): Promise<StepResult> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Fetch recommendation items with test catalog data
    const { data: recItems, error: itemsError } = await supabaseAdmin
      .from('tt_recommendation_item')
      .select('id, test_id, quantity, lab_id')
      .eq('recommendation_id', recommendationId);

    if (itemsError) throw itemsError;
    if (!recItems || recItems.length === 0) {
      return { status: 'skipped', completed_at: new Date().toISOString(), note: 'No items in recommendation' };
    }

    // Fetch test catalog entries
    const testIds = recItems.map(item => item.test_id).filter(Boolean);
    const { data: testCatalog, error: catalogError } = await supabaseAdmin
      .from('tt_test_catalog')
      .select('id, sku, name, lab_id, materials')
      .in('id', testIds);

    if (catalogError) throw catalogError;

    const catalogMap = new Map((testCatalog || []).map(t => [t.id, t]));

    // Build calculator input
    const calculatorItems = recItems.map((item: any) => {
      const catalogEntry = catalogMap.get(item.test_id);
      return {
        test_id: item.test_id || '',
        test_name: catalogEntry?.name || 'Unknown',
        test_sku: catalogEntry?.sku || '',
        lab_id: item.lab_id || catalogEntry?.lab_id || null,
        materials: Array.isArray(catalogEntry?.materials) ? catalogEntry.materials : [],
      };
    });

    // Calculate and save
    const calculated = calculateMaterials(calculatorItems);
    const result = await saveRecommendationMaterials(recommendationId, calculated);

    if (!result.success) throw new Error(result.error || 'Failed to save materials');

    return {
      status: 'completed',
      completed_at: new Date().toISOString(),
      material_count: calculated.length,
    };
  } catch (err: any) {
    console.error(`[Preparation] Materials step failed for order ${orderId}:`, err);
    return { status: 'failed', attempted_at: new Date().toISOString(), error: err.message };
  }
}

// ============================================================
// STEP: Create shipments (one per lab)
// ============================================================

async function createShipments(
  orderId: string,
  recommendationId: string,
  supabase: any
): Promise<{ success: boolean; shipment_count: number; error?: string }> {
  try {
    // Check if shipments already exist for this order
    const { data: existing } = await supabase
      .from('tt_order_shipment')
      .select('id')
      .eq('order_id', orderId);
    
    if (existing && existing.length > 0) {
      return { success: true, shipment_count: existing.length };
    }

    // Fetch recommendation items with test + lab info
    const { data: items } = await supabase
      .from('tt_recommendation_item')
      .select(`
        id, test_id, quantity,
        test:test_id(id, name, sku, sample_shipping, lab:lab_id(id, name))
      `)
      .eq('recommendation_id', recommendationId);

    if (!items || items.length === 0) {
      return { success: true, shipment_count: 0 };
    }

    // Determine shipping method: if ANY test has sample_shipping containing 'gologistik', all go via GoLogistik
    const hasGoLogistik = items.some((item: any) => {
      const shipping = (item.test?.sample_shipping || '').toLowerCase();
      return shipping.includes('gologistik') || shipping.includes('go!') || shipping.includes('go logistik');
    });
    const shippingMethod = hasGoLogistik ? 'gologistik' : 'standard';

    // Group tests by lab
    const labGroups = new Map<string, { lab_id: string; lab_name: string; tests: any[] }>();
    for (const item of items) {
      const labId = item.test?.lab?.id;
      const labName = item.test?.lab?.name || 'Unknown';
      if (!labId) continue;
      
      if (!labGroups.has(labId)) {
        labGroups.set(labId, { lab_id: labId, lab_name: labName, tests: [] });
      }
      labGroups.get(labId)!.tests.push({
        test_id: item.test_id,
        test_name: item.test?.name || '',
        test_sku: item.test?.sku || '',
      });
    }

    // Fetch calculated materials to attach to each shipment
    const { data: materials } = await supabase
      .from('tt_recommendation_material')
      .select(`
        *,
        material:material_id(id, code, name),
        laboratory:laboratory_id(id, name)
      `)
      .eq('recommendation_id', recommendationId);

    // Create one shipment per lab
    const shipments = [];
    for (const [labId, group] of labGroups) {
      // Get materials for this lab
      const labMaterials = (materials || [])
        .filter((m: any) => m.laboratory_id === labId)
        .map((m: any) => ({
          material_name: m.material?.name || '',
          material_code: m.material?.code || '',
          tube_count: m.calculated_tube_count || 1,
        }));

      shipments.push({
        order_id: orderId,
        laboratory_id: labId,
        shipping_method: shippingMethod,
        status: shippingMethod === 'standard' ? 'pending' : 'awaiting_schedule',
        tests: group.tests,
        materials: labMaterials,
      });
    }

    if (shipments.length > 0) {
      const { error: insertErr } = await supabase
        .from('tt_order_shipment')
        .insert(shipments);
      
      if (insertErr) throw insertErr;
    }

    return { success: true, shipment_count: shipments.length };
  } catch (err: any) {
    console.error('[Shipments] Creation failed:', err);
    return { success: false, shipment_count: 0, error: err.message };
  }
}

// ============================================================
// STEP 2: ANAMNESE PDF (PLACEHOLDER)
// ============================================================

async function stepAnamnesePdf(orderId: string, recommendationId: string): Promise<StepResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: order } = await supabaseAdmin
      .from('tt_order')
      .select('display_id')
      .eq('id', orderId)
      .single();

    const orderDisplayId = order?.display_id || orderId.substring(0, 8);

    const result = await generateAnamnese(orderId, orderDisplayId, recommendationId);

    if (!result.success) {
      return { status: 'failed', attempted_at: new Date().toISOString(), error: result.error || 'Unknown error' };
    }

    return {
      status: 'completed',
      completed_at: new Date().toISOString(),
      file_count: result.files.length,
      labs: result.files.map(f => f.lab_name),
    };
  } catch (err: any) {
    console.error(`[Preparation] Anamnese PDF step failed for order ${orderId}:`, err);
    return { status: 'failed', attempted_at: new Date().toISOString(), error: err.message };
  }
}

// ============================================================
// STEP 3: LDT FILE (PLACEHOLDER)
// ============================================================

async function stepLdtFile(orderId: string, recommendationId: string): Promise<StepResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: order } = await supabaseAdmin
      .from('tt_order')
      .select('*, patient:tt_patient(*), recommendation:tt_recommendation(*)')
      .eq('id', orderId)
      .single();

    const patient = order?.patient;
    const recommendation = order?.recommendation;

    if (!patient || !recommendation) {
      return { status: 'failed', attempted_at: new Date().toISOString(), error: 'Missing patient or recommendation data' };
    }

    const result = await generateLdtExport(
      orderId,
      order.display_id || recommendation.display_id || '',
      recommendation.id,
      {
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
        address_street: patient.address_street || patient.address_line1 || '',
        address_house_no: patient.address_house_no || '',
        address_zip: patient.address_zip || '',
        address_city: patient.address_city || '',
      },
      patient.insured_status || 'selbstzahler'
    );

    if (!result.success) {
      return { status: 'failed', attempted_at: new Date().toISOString(), error: result.error || 'LDT generation failed' };
    }

    // Update order with file URLs
    await supabaseAdmin
      .from('tt_order')
      .update({
        ldt_file_url: result.ldtUrl,
        tif_file_url: result.tifUrl,
      })
      .eq('id', orderId);

    return { 
      status: 'completed',
      completed_at: new Date().toISOString(),
      ldt_url: result.ldtUrl,
      tif_url: result.tifUrl
    };
  } catch (err: any) {
    console.error(`[Preparation] LDT step failed for order ${orderId}:`, err);
    return { status: 'failed', attempted_at: new Date().toISOString(), error: err.message };
  }
}

// ============================================================
// STEP 4: PVS/PAD SNAPSHOT (PLACEHOLDER)
// ============================================================

async function stepPadPvs(orderId: string, recommendationId: string): Promise<StepResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: order } = await supabaseAdmin
      .from('tt_order')
      .select('display_id')
      .eq('id', orderId)
      .single();

    const orderDisplayId = order?.display_id || orderId.substring(0, 8);

    const result = await generatePadPvsSnapshot(orderId, orderDisplayId, recommendationId);

    if (!result.success) {
      return { status: 'failed', attempted_at: new Date().toISOString(), error: result.error || 'Unknown error' };
    }

    if (!result.snapshot) {
      return { status: 'skipped', completed_at: new Date().toISOString(), note: 'No items to snapshot' };
    }

    return {
      status: 'completed',
      completed_at: new Date().toISOString(),
      position_count: result.snapshot.totals.position_count,
      labs: result.snapshot.totals.labs_involved,
    };
  } catch (err: any) {
    console.error(`[Preparation] PAD/PVS step failed for order ${orderId}:`, err);
    return { status: 'failed', attempted_at: new Date().toISOString(), error: err.message };
  }
}

// ============================================================
// STEP 5: DHL LABEL (PLACEHOLDER)
// ============================================================

async function stepDhlLabel(orderId: string, recommendationId: string): Promise<StepResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch order shipping address to verify it exists
    const { data: order, error: orderError } = await supabaseAdmin
      .from('tt_order')
      .select('id, shipping_address')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return { status: 'failed', attempted_at: new Date().toISOString(), error: 'Order not found' };
    }

    if (!order.shipping_address || !order.shipping_address.line1) {
      return { status: 'failed', attempted_at: new Date().toISOString(), error: 'No shipping address on order' };
    }

    // Generate mock tracking numbers
    const timestamp = Date.now().toString().slice(-10);
    const outboundTracking = `MOCK-OUT-${timestamp}`;
    const returnTracking = `MOCK-RET-${timestamp}`;

    // Store tracking numbers on the order
    const { error: updateError } = await supabaseAdmin
      .from('tt_order')
      .update({
        dhl_tracking_outbound: outboundTracking,
        dhl_tracking_return: returnTracking,
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    console.log(`[Preparation] DHL mock: outbound=${outboundTracking}, return=${returnTracking} for order ${orderId}`);

    return {
      status: 'completed',
      completed_at: new Date().toISOString(),
      mock: true,
      outbound_tracking: outboundTracking,
      return_tracking: returnTracking,
      note: 'Mock tracking numbers — replace with real DHL API when credentials are available',
    };
  } catch (err: any) {
    console.error(`[Preparation] DHL step failed for order ${orderId}:`, err);
    return { status: 'failed', attempted_at: new Date().toISOString(), error: err.message };
  }
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

/**
 * runOrderPreparation
 * 
 * Executes all preparation pipeline steps for an order.
 * Each step runs independently — failures don't block other steps.
 * Results are stored in tt_order.preparation_status.
 * 
 * @param orderId - The tt_order.id
 * @returns Object with overall success flag and per-step results
 */
export async function runOrderPreparation(orderId: string): Promise<{
  success: boolean;
  steps: Partial<PreparationStatus>;
  errors: string[];
}> {
  const supabaseAdmin = getSupabaseAdmin();
  const errors: string[] = [];

  console.log(`[Preparation] Starting pipeline for order ${orderId}`);

  // 1. Fetch the order to get recommendation_id
  const { data: order, error: orderError } = await supabaseAdmin
    .from('tt_order')
    .select('id, recommendation_id, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    const msg = `Order not found: ${orderId}`;
    console.error(`[Preparation] ${msg}`);
    return { success: false, steps: {}, errors: [msg] };
  }

  const recommendationId = order.recommendation_id;

  // 2. Run each step independently
  const steps: Partial<PreparationStatus> = {};

  // Step 1: Materials
  steps.materials = await stepMaterials(orderId, recommendationId);
  if (steps.materials.status === 'failed') errors.push(`Materials: ${steps.materials.error}`);

  // After materials step, before DHL:
  const shipmentResult = await createShipments(orderId, order.recommendation_id, supabaseAdmin);
  console.log(`[Pipeline] Shipments: ${shipmentResult.shipment_count} created, method: ${shipmentResult.success ? 'ok' : shipmentResult.error}`);

  // Step 2: Anamnese PDF
  steps.anamnese_pdf = await stepAnamnesePdf(orderId, recommendationId);
  if (steps.anamnese_pdf.status === 'failed') errors.push(`Anamnese PDF: ${steps.anamnese_pdf.error}`);

  // Step 3: LDT File
  steps.ldt_file = await stepLdtFile(orderId, recommendationId);
  if (steps.ldt_file.status === 'failed') errors.push(`LDT File: ${steps.ldt_file.error}`);

  // Step 4: PVS/PAD
  steps.pad_pvs = await stepPadPvs(orderId, recommendationId);
  if (steps.pad_pvs.status === 'failed') errors.push(`PAD/PVS: ${steps.pad_pvs.error}`);

  // Step 5: DHL Label
  steps.dhl_label = await stepDhlLabel(orderId, recommendationId);
  if (steps.dhl_label.status === 'failed') errors.push(`DHL Label: ${steps.dhl_label.error}`);

  // 3. Save preparation status to the order
  const { error: updateError } = await supabaseAdmin
    .from('tt_order')
    .update({ preparation_status: steps })
    .eq('id', orderId);

  if (updateError) {
    console.error(`[Preparation] Failed to save preparation_status:`, updateError);
    errors.push(`Failed to save status: ${updateError.message}`);
  }

  const success = errors.length === 0;
  console.log(`[Preparation] Pipeline ${success ? 'completed' : 'completed with errors'} for order ${orderId}. Steps: ${JSON.stringify(steps)}`);

  return { success, steps, errors };
}
