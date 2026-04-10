export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { generatePadBatchExport } from '@/lib/pad-xml-generator';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/admin/exports/pad
 * 
 * Body: { order_ids: string[] } — specific orders to export
 *   OR: { date_from: string, date_to: string } — date range
 *   OR: { lab_name: string } — all unexported orders for a specific lab
 * 
 * Returns XML file(s) as JSON with download URLs or inline XML content.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();
    
    let orderIds: string[] = [];
    
    if (body.order_ids && Array.isArray(body.order_ids)) {
      orderIds = body.order_ids;
    } else {
      // Build query for orders with PAD data
      let query = supabase
        .from('tt_order')
        .select('id')
        .not('pad_pvs_data', 'is', null);
      
      if (body.date_from) {
        query = query.gte('created_at', body.date_from);
      }
      if (body.date_to) {
        query = query.lte('created_at', body.date_to);
      }
      
      const { data: orders, error } = await query;
      if (error) throw error;
      orderIds = (orders || []).map(o => o.id);
    }
    
    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'No orders found for export' }, { status: 404 });
    }
    
    // Generate PAD XML
    const result = await generatePadBatchExport(orderIds);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    // If single file, return XML directly
    if (result.files.length === 1) {
      const file = result.files[0];
      return new NextResponse(file.xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': \`attachment; filename="\${file.filename}"\`,
        },
      });
    }
    
    // Multiple files — return as JSON with content
    return NextResponse.json({
      success: true,
      files: result.files.map(f => ({
        lab_name: f.labName,
        filename: f.filename,
        xml: f.xml,
        order_count: f.xml.split('<rechnung ').length - 1,
      })),
    });
    
  } catch (err: any) {
    console.error('[PAD Export] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
