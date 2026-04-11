import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; resultId: string } }
) {
  try {
    const db = supabaseAdmin();

    // Get the result to find file_path
    const { data: result, error: fetchError } = await db
      .from('tt_order_result')
      .select('file_path')
      .eq('id', params.resultId)
      .eq('order_id', params.id)
      .single();

    if (fetchError || !result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Delete from storage
    await db.storage.from('order-results').remove([result.file_path]);

    // Delete record
    const { error: deleteError } = await db
      .from('tt_order_result')
      .delete()
      .eq('id', params.resultId);

    if (deleteError) {
      console.error('[Results Delete] DB error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Results Delete] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
