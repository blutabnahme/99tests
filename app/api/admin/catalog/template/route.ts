export const dynamic = 'force-dynamic';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import * as xlsx from 'xlsx';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const headers = [
      'SKU', 'Name', 'Type', 'Category', 'Laboratory', 'Lab Cost',
      'Price Insured', 'Price Uninsured', 'Price Zone 1', 'Price Zone 2', 'Price Zone 3',
      'Materials', 'Sample Shipping', 'Preanalytics', 'More Info URL',
      'EDV Code', 'GoÄ Digit', 'GoÄ Costs', 'GoÄ Names', 'GoÄ Factor',
      'Included Parameters', 'Active'
    ];

    const ws = xlsx.utils.aoa_to_sheet([headers]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template");

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.document',
        'Content-Disposition': `attachment; filename=99tests-catalog-template.xlsx`,
      }
    });

  } catch (error: any) {
    console.error("Template Error:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
