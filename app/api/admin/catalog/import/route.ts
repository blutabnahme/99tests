export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';

export async function POST(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm') === 'true';

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const wb = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json<any>(ws);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch maps for validation
    const { data: labsData } = await supabaseAdmin.from('tt_laboratory').select('id, name');
    const labMap = new Map<string, string>();
    labsData?.forEach(l => labMap.set((l.name || '').trim().toLowerCase(), l.id));

    const { data: testsData } = await supabaseAdmin.from('tt_test_catalog').select('id, sku, type');
    const existingTestMap = new Map<string, any>();
    testsData?.forEach(t => existingTestMap.set((t.sku || '').trim().toLowerCase(), t));

    let total_rows = rawRows.length;
    let valid = 0;
    let errorsCount = 0;
    let inserts = 0;
    let updates = 0;
    const error_details: any[] = [];
    
    const validPayloads: any[] = [];

    // Process each row
    for (let i = 0; i < rawRows.length; i++) {
        const rowNum = i + 2; // +1 for 0-index, +1 for headers
        const row = rawRows[i];
        const rowErrors: string[] = [];
        
        const sku = (row['SKU'] || '').toString().trim();
        const name = (row['Name'] || '').toString().trim();
        const typeRaw = (row['Type'] || '').toString().trim().toLowerCase();
        
        let isValid = true;

        if (!sku) { rowErrors.push("SKU is required"); isValid = false; }
        if (!name) { rowErrors.push("Name is required"); isValid = false; }
        if (typeRaw !== 'parameter' && typeRaw !== 'profile') { rowErrors.push("Type must be parameter or profile"); isValid = false; }
        
        const labName = (row['Laboratory'] || '').toString().trim();
        let lab_id = null;
        if (labName) {
            lab_id = labMap.get(labName.toLowerCase());
            if (!lab_id) { rowErrors.push(`Unknown laboratory: ${labName}`); isValid = false; }
        }

        const parseNum = (val: any) => {
            if (val === undefined || val === null || val === '') return null;
            const res = parseFloat(val);
            return isNaN(res) ? null : res;
        };

        const lab_cost = parseNum(row['Lab Cost']);
        const price_insured = parseNum(row['Price Insured']);
        const price_uninsured = parseNum(row['Price Uninsured']);
        const price_zone1 = parseNum(row['Price Zone 1']);
        const price_zone2 = parseNum(row['Price Zone 2']);
        const price_zone3 = parseNum(row['Price Zone 3']);

        let materials = null;
        if (row['Materials']) {
            try {
                const parsed = JSON.parse(row['Materials']);
                if (Array.isArray(parsed)) {
                    materials = parsed.map((m: any) => ({
                        material_code: String(m.material_code || ''),
                        name: String(m.name || ''),
                        volume: m.volume != null ? parseFloat(String(m.volume)) : undefined,
                        unit: m.unit ? String(m.unit) : undefined,
                        qty: m.qty != null ? parseInt(String(m.qty)) : undefined,
                    }));
                } else {
                    materials = parsed;
                }
            } catch(e) {
                rowErrors.push("Materials must be valid JSON object/array"); isValid=false;
            }
        }

        const includedParamsRaw = (row['Included Parameters'] || '').toString().trim();
        let included_parameters: string[] | null = null;

        if (typeRaw === 'profile' && includedParamsRaw) {
            const skus = includedParamsRaw.split(',').map((s: string) => s.trim()).filter(Boolean);
            included_parameters = [];
            for (const s of skus) {
                const existing = existingTestMap.get(s.toLowerCase());
                if (!existing) {
                    rowErrors.push(`Included parameter SKU not found: ${s}`);
                    isValid = false;
                } else if (existing.type !== 'parameter') {
                    rowErrors.push(`SKU ${s} is a profile, cannot include profiles in profiles`);
                    isValid = false;
                } else {
                    included_parameters.push(existing.id);
                }
            }
        }

        const existingItem = sku ? existingTestMap.get(sku.toLowerCase()) : null;
        if (isValid) {
            if (existingItem) updates++; else inserts++;
            valid++;

            validPayloads.push({
                operation: existingItem ? 'update' : 'insert',
                id: existingItem ? existingItem.id : undefined,
                payload: {
                    sku,
                    name,
                    type: typeRaw,
                    category: row['Category'] || null,
                    lab_id,
                    lab_cost, price_insured, price_uninsured, price_zone1, price_zone2, price_zone3,
                    materials,
                    sample_shipping: row['Sample Shipping'] ? row['Sample Shipping'].toLowerCase() : null,
                    preanalytics: row['Preanalytics'] || null,
                    more_info_url: row['More Info URL'] || null,
                    edv_code: row['EDV Code'] || null,
                    goae_digit: row['GoÄ Digit'] || null,
                    goae_costs: row['GoÄ Costs'] || null,
                    goae_names: row['GoÄ Names'] || null,
                    goae_factor: row['GoÄ Factor'] || null,
                    included_parameters,
                    is_active: row['Active'] === 'no' ? false : true // default true
                }
            });
        } else {
            errorsCount++;
            error_details.push({
                row: rowNum,
                sku: sku || '<Missing>',
                errors: rowErrors
            });
        }
    }

    if (confirm) {
        // Execute writes sequentially to avoid overloading connections, or batch them
        // For updates, we do individually. For inserts, we can do in batches.
        const insertsBatch = validPayloads.filter(p => p.operation === 'insert').map(p => p.payload);
        const updatesBatch = validPayloads.filter(p => p.operation === 'update');

        if (insertsBatch.length > 0) {
            const { error: insErr } = await supabaseAdmin.from('tt_test_catalog').insert(insertsBatch);
            if (insErr) throw insErr;
        }

        for (const up of updatesBatch) {
            const { error: upErr } = await supabaseAdmin.from('tt_test_catalog').update(up.payload).eq('id', up.id);
            if (upErr) {
               console.error("Failed to update ID:", up.id, upErr);
            }
        }
    }

    return NextResponse.json({
        total_rows,
        valid,
        errors: errorsCount,
        inserts,
        updates,
        error_details,
        preview: !confirm
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
