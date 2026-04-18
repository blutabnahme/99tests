export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { action, ids } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'action and ids[] are required' }, { status: 400 });
    }

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be: activate, deactivate, or delete' }, { status: 400 });
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 items per bulk operation' }, { status: 400 });
    }

    if (action === 'activate') {
      const { error } = await supabaseAdmin
        .from('tt_material')
        .update({ is_active: true })
        .in('id', ids);
      if (error) throw error;
      return NextResponse.json({ success: true, action, count: ids.length });
    }

    if (action === 'deactivate') {
      const { error } = await supabaseAdmin
        .from('tt_material')
        .update({ is_active: false })
        .in('id', ids);
      if (error) throw error;
      return NextResponse.json({ success: true, action, count: ids.length });
    }

    if (action === 'delete') {
      // Delete one by one so we can count successes vs FK failures
      let deleted = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        const { error } = await supabaseAdmin
          .from('tt_material')
          .delete()
          .eq('id', id);

        if (error) {
          failed++;
          errors.push(`${id}: ${error.message}`);
        } else {
          deleted++;
        }
      }

      return NextResponse.json({
        success: failed === 0,
        action,
        deleted,
        failed,
        ...(errors.length > 0 ? { errors } : {})
      });
    }
  } catch (error: any) {
    console.error("POST admin materials/bulk error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
