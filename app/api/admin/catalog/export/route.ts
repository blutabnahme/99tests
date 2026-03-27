export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lab_id = searchParams.get('lab_id');
    const category = searchParams.get('category');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin.from('tt_test_catalog').select(`*, lab:lab_id(name)`).eq('is_active', true);
    
    if (lab_id && lab_id !== 'all') query = query.eq('lab_id', lab_id);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;

    // Fetch SKUs for included_parameters
    const profileRefs = new Set<string>();
    data.forEach(t => {
      if (t.type === 'profile' && Array.isArray(t.included_parameters)) {
        t.included_parameters.forEach((id: string) => profileRefs.add(id));
      }
    });

    const skuMap = new Map<string, string>();
    if (profileRefs.size > 0) {
      const ids = Array.from(profileRefs);
      // Process in batches of 100 to avoid query string length limits
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const { data: pData } = await supabaseAdmin.from('tt_test_catalog').select('id, sku').in('id', batch);
        if (pData) {
          pData.forEach(p => skuMap.set(p.id, p.sku));
        }
      }
    }

    const rows = data.map(test => {
      let includedStr = '';
      if (test.type === 'profile' && Array.isArray(test.included_parameters)) {
        includedStr = test.included_parameters.map((id: string) => skuMap.get(id)).filter(Boolean).join(',');
      }

      return {
        'SKU': test.sku || '',
        'Name': test.name || '',
        'Type': test.type || '',
        'Category': test.category || '',
        'Laboratory': test.lab?.name || '',
        'Lab Cost': test.lab_cost !== null ? test.lab_cost : '',
        'Price Insured': test.price_insured !== null ? test.price_insured : '',
        'Price Uninsured': test.price_uninsured !== null ? test.price_uninsured : '',
        'Price Zone 1': test.price_zone_1 !== null ? test.price_zone_1 : '',
        'Price Zone 2': test.price_zone_2 !== null ? test.price_zone_2 : '',
        'Price Zone 3': test.price_zone_3 !== null ? test.price_zone_3 : '',
        'Materials': test.materials ? JSON.stringify(test.materials) : '',
        'Sample Shipping': test.sample_shipping || '',
        'Preanalytics': test.preanalytics || '',
        'More Info URL': test.more_info_url || '',
        'EDV Code': test.edv_code || '',
        'GoÄ Digit': test.goa_digit || '',
        'GoÄ Costs': test.goa_costs || '',
        'GoÄ Names': test.goa_names || '',
        'GoÄ Factor': test.goa_factor || '',
        'Included Parameters': includedStr,
        'Active': test.is_active ? 'yes' : 'no'
      };
    });

    const ws = xlsx.utils.json_to_sheet(rows);
    
    // Make headers bold (if supported by the simple json_to_sheet format, else just normal headers)
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Catalog");
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().split('T')[0];

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.document',
        'Content-Disposition': `attachment; filename=99tests-catalog-${dateStr}.xlsx`,
      }
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
