import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

interface PadPosition {
  parameter_name: string;
  parameter_sku: string;
  goae_digit: string;
  goae_cost: string;
  goae_name: string;
  goae_factor: string;
  edv_code: string;
  laboratory: string;
  laboratory_id: string;
  quantity: number;
}

interface PadSnapshot {
  order_id: string;
  order_display_id: string;
  recommendation_id: string;
  patient: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    insurance_type: string;
  };
  doctor: {
    full_name: string;
    practice_name: string;
    license_number?: string;
  };
  positions: PadPosition[];
  totals: {
    position_count: number;
    labs_involved: string[];
  };
  generated_at: string;
}

// ============================================================
// MAIN EXPORT
// ============================================================

export async function generatePadPvsSnapshot(
  orderId: string,
  orderDisplayId: string,
  recommendationId: string
): Promise<{ success: boolean; snapshot: PadSnapshot | null; error?: string }> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch recommendation with patient + doctor
    const { data: rec, error: recError } = await supabaseAdmin
      .from('tt_recommendation')
      .select(`
        id, pricing_tier,
        patient:patient_id(first_name, last_name, date_of_birth, gender, insured_status),
        doctor:doctor_id(full_name, practice_name, license_number)
      `)
      .eq('id', recommendationId)
      .single();

    if (recError || !rec) throw new Error('Failed to fetch recommendation');

    const patientData = rec.patient as any;
    const doctorData = rec.doctor as any;

    // 2. Fetch recommendation items with GoÄ data
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('tt_recommendation_item')
      .select(`
        id, test_id, test_type, quantity,
        test:test_id(
          id, name, sku, type, edv_code,
          goae_digit, goae_costs, goae_names, goae_factor,
          included_parameters,
          lab:lab_id(id, name)
        )
      `)
      .eq('recommendation_id', recommendationId);

    if (itemsError) throw itemsError;
    if (!items || items.length === 0) {
      return { success: true, snapshot: null, error: 'No items in recommendation' };
    }

    // 3. Expand profiles and collect GoÄ positions
    const positions: PadPosition[] = [];

    // Fetch parameter details for profile expansion
    const allParamIds = new Set<string>();
    for (const item of items) {
      const test = item.test as any;
      if (test?.type === 'profile' && Array.isArray(test.included_parameters)) {
        test.included_parameters.forEach((id: string) => allParamIds.add(id));
      }
    }

    const paramDetailsMap = new Map<string, any>();
    if (allParamIds.size > 0) {
      const ids = Array.from(allParamIds);
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const { data: params } = await supabaseAdmin
          .from('tt_test_catalog')
          .select('id, name, sku, edv_code, goae_digit, goae_costs, goae_names, goae_factor, lab:lab_id(id, name)')
          .in('id', batch);
        params?.forEach(p => paramDetailsMap.set(p.id, p));
      }
    }

    for (const item of items) {
      const test = item.test as any;
      if (!test) continue;

      const labName = test.lab?.name || '';
      const labId = test.lab?.id || '';

      if (test.type === 'profile' && Array.isArray(test.included_parameters)) {
        // Expand profile: each included parameter gets its own GoÄ position
        for (const paramId of test.included_parameters) {
          const param = paramDetailsMap.get(paramId);
          if (!param) continue;

          positions.push({
            parameter_name: param.name || '',
            parameter_sku: param.sku || '',
            goae_digit: param.goae_digit || '',
            goae_cost: param.goae_costs || '',
            goae_name: param.goae_names || '',
            goae_factor: param.goae_factor || '',
            edv_code: param.edv_code || '',
            laboratory: param.lab?.name || labName,
            laboratory_id: param.lab?.id || labId,
            quantity: item.quantity || 1,
          });
        }
      } else {
        // Single parameter
        positions.push({
          parameter_name: test.name || '',
          parameter_sku: test.sku || '',
          goae_digit: test.goae_digit || '',
          goae_cost: test.goae_costs || '',
          goae_name: test.goae_names || '',
          goae_factor: test.goae_factor || '',
          edv_code: test.edv_code || '',
          laboratory: labName,
          laboratory_id: labId,
          quantity: item.quantity || 1,
        });
      }
    }

    // 4. Build snapshot
    const labsInvolved = Array.from(new Set(positions.map(p => p.laboratory).filter(Boolean)));

    const snapshot: PadSnapshot = {
      order_id: orderId,
      order_display_id: orderDisplayId,
      recommendation_id: recommendationId,
      patient: {
        first_name: patientData?.first_name || '',
        last_name: patientData?.last_name || '',
        date_of_birth: patientData?.date_of_birth || '',
        gender: patientData?.gender || '',
        insurance_type: patientData?.insured_status || rec.pricing_tier || '',
      },
      doctor: {
        full_name: doctorData?.full_name || '',
        practice_name: doctorData?.practice_name || '',
        license_number: doctorData?.license_number || undefined,
      },
      positions,
      totals: {
        position_count: positions.length,
        labs_involved: labsInvolved,
      },
      generated_at: new Date().toISOString(),
    };

    // 5. Store on the order
    const { error: updateError } = await supabaseAdmin
      .from('tt_order')
      .update({ pad_pvs_data: snapshot })
      .eq('id', orderId);

    if (updateError) {
      console.error('[PAD/PVS] Failed to save snapshot:', updateError);
      throw updateError;
    }

    return { success: true, snapshot };
  } catch (err: any) {
    console.error('[PAD/PVS] Snapshot generation failed:', err);
    return { success: false, snapshot: null, error: err.message };
  }
}
