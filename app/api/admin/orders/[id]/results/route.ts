import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = supabaseAdmin();
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const laboratory_id = formData.get('laboratory_id') as string | null;
    const tests_covered = formData.get('tests_covered') as string; // JSON string
    const visibility = formData.get('visibility') as string || 'doctor_and_patient';
    const auto_release = formData.get('auto_release') === 'true';
    const admin_notes = formData.get('admin_notes') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer();
    const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = `${params.id}/${safeFilename}`;

    const { error: uploadError } = await db.storage
      .from('order-results')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Results Upload] Storage error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Determine status based on visibility and auto_release
    let status = 'uploaded';
    let released_at = null;
    let released_by = null;

    if (auto_release && (visibility === 'doctor_and_patient' || visibility === 'patient_only')) {
      status = 'released';
      released_at = new Date().toISOString();
      released_by = 'auto';
    } else if (!auto_release && visibility === 'doctor_and_patient') {
      status = 'doctor_reviewing';
    }

    // Parse tests_covered
    let parsedTests = [];
    try {
      parsedTests = JSON.parse(tests_covered || '[]');
    } catch {}

    // Insert record
    const { data: result, error: insertError } = await db
      .from('tt_order_result')
      .insert({
        order_id: params.id,
        laboratory_id: laboratory_id || null,
        file_path: filePath,
        file_name: file.name,
        file_type: 'pdf',
        file_size_bytes: file.size,
        tests_covered: parsedTests,
        visibility,
        status,
        auto_release,
        released_at,
        released_by,
        uploaded_by: 'admin',
        admin_notes: admin_notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Results Upload] DB error:', insertError);
      return NextResponse.json({ error: 'Failed to save result record' }, { status: 500 });
    }

    // Check if all tests now have results -> update order status
    try {
      const { data: orderData } = await db
        .from('tt_order')
        .select('recommendation_id')
        .eq('id', params.id)
        .single();
    
      if (orderData?.recommendation_id) {
        const { data: items } = await db
          .from('tt_recommendation_item')
          .select('id, test:test_id(id, name)')
          .eq('recommendation_id', orderData.recommendation_id);
    
        // Get all results for this order
        const { data: allResults } = await db
          .from('tt_order_result')
          .select('tests_covered')
          .eq('order_id', params.id);
    
        // Collect all covered test names
        const coveredNames = new Set<string>();
        (allResults || []).forEach((r: any) => {
          (r.tests_covered || []).forEach((t: any) => {
            const name = (t.test_name || t.name || '').toLowerCase();
            if (name) coveredNames.add(name);
          });
        });
    
        // Check if all tests are covered
        const allTestNames = (items || []).map((item: any) =>
          (item.test?.name || '').toLowerCase()
        ).filter(Boolean);
    
        const allCovered = allTestNames.length > 0 && allTestNames.every(name => coveredNames.has(name));
    
        if (allCovered) {
          // Update order status to results_ready
          const { data: currentOrder } = await db
            .from('tt_order')
            .select('status')
            .eq('id', params.id)
            .single();
    
          // Only update if current status allows it (don't go backwards)
          const validPreviousStatuses = ['at_lab', 'returning_to_lab', 'awaiting_collection', 'collection_organized', 'kit_shipped', 'preparing'];
          if (currentOrder && validPreviousStatuses.includes(currentOrder.status)) {
            await db
              .from('tt_order')
              .update({ status: 'results_ready' })
              .eq('id', params.id);
          }
        }
      }
    } catch (statusError) {
      console.error('[Results Upload] Status check error:', statusError);
    }
    // TODO: Send notifications based on visibility

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('[Results Upload] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = supabaseAdmin();

    const { data: results, error } = await db
      .from('tt_order_result')
      .select('*, laboratory:laboratory_id(name, address_city)')
      .eq('order_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Results List] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('[Results List] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
