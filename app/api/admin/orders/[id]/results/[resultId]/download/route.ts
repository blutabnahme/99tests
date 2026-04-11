import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string; resultId: string } }
) {
  try {
    const db = supabaseAdmin();

    const { data: result, error } = await db
      .from('tt_order_result')
      .select('file_path, file_name')
      .eq('id', params.resultId)
      .eq('order_id', params.id)
      .single();

    if (error || !result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    const { data: signedUrlData, error: urlError } = await db.storage
      .from('order-results')
      .createSignedUrl(result.file_path, 3600); // 1 hour expiry

    if (urlError || !signedUrlData) {
      console.error('[Results Download] Signed URL error:', urlError);
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrlData.signedUrl, file_name: result.file_name });
  } catch (error: any) {
    console.error('[Results Download] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
