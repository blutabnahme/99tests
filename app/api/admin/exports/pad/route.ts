export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { runPadExport } from '@/lib/pad-xml-generator';

export async function POST(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date_start, date_end, lab_id, include_exported } = body;

    if (!date_start || !date_end) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    const result = await runPadExport({
      dateStart: date_start,
      dateEnd: date_end,
      labId: lab_id || undefined,
      includeExported: include_exported || false,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('PAD export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
