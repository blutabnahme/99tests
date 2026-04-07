export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function GET(request: Request, context: any) {
  const { params } = context;
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

    // Get doctor info
    const { data: doctor } = await supabaseAdmin
      .from('tt_doctor')
      .select('id, full_name, practice_name')
      .eq('id', params.id)
      .single();

    // Get webhook config
    const { data: webhook } = await supabaseAdmin
      .from('tt_webhook')
      .select('*')
      .eq('doctor_id', params.id)
      .limit(1)
      .maybeSingle();

    // Get API keys
    const { data: apiKeys } = await supabaseAdmin
      .from('tt_api_key')
      .select('id, key_prefix, label, is_active, last_used_at, created_at')
      .eq('doctor_id', params.id)
      .order('created_at', { ascending: false });

    // Get recent webhook logs
    let logs: any[] = [];
    if (webhook) {
      const { data: logData } = await supabaseAdmin
        .from('tt_webhook_log')
        .select('*')
        .eq('webhook_id', webhook.id)
        .order('delivered_at', { ascending: false })
        .limit(20);
      logs = logData || [];
    }

    return NextResponse.json({
      doctor,
      webhook,
      api_keys: apiKeys || [],
      logs,
    });
  } catch (error: any) {
    console.error('GET webhooks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, context: any) {
  const { params } = context;
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
    const { action } = body;

    switch (action) {
      case 'save_webhook': {
        const { webhook_url, events, is_active } = body;
        const webhookSecret = crypto.randomBytes(32).toString('hex');

        // Upsert webhook config
        const { data: existing } = await supabaseAdmin
          .from('tt_webhook')
          .select('id')
          .eq('doctor_id', params.id)
          .maybeSingle();

        if (existing) {
          const updateData: any = { webhook_url, events, is_active, updated_at: new Date().toISOString() };
          // Only set secret on first creation
          const { error } = await supabaseAdmin.from('tt_webhook').update(updateData).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabaseAdmin.from('tt_webhook').insert({
            doctor_id: params.id,
            webhook_url,
            webhook_secret: webhookSecret,
            events,
            is_active,
          });
          if (error) throw error;
        }

        return NextResponse.json({ success: true });
      }

      case 'regenerate_secret': {
        const newSecret = crypto.randomBytes(32).toString('hex');
        const { error } = await supabaseAdmin
          .from('tt_webhook')
          .update({ webhook_secret: newSecret, updated_at: new Date().toISOString() })
          .eq('doctor_id', params.id);
        if (error) throw error;
        return NextResponse.json({ success: true, secret: newSecret });
      }

      case 'generate_api_key': {
        const { label } = body;
        // Generate a random API key
        const rawKey = `99t_${crypto.randomBytes(24).toString('hex')}`;
        const prefix = rawKey.substring(0, 12) + '...';
        const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const { error } = await supabaseAdmin.from('tt_api_key').insert({
          doctor_id: params.id,
          key_prefix: prefix,
          key_hash: hash,
          label: label || 'Default',
        });
        if (error) throw error;

        // Return the full key ONCE — it won't be shown again
        return NextResponse.json({ success: true, api_key: rawKey, prefix });
      }

      case 'revoke_api_key': {
        const { key_id } = body;
        const { error } = await supabaseAdmin
          .from('tt_api_key')
          .update({ is_active: false })
          .eq('id', key_id)
          .eq('doctor_id', params.id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'delete_api_key': {
        const { key_id } = body;
        const { error } = await supabaseAdmin
          .from('tt_api_key')
          .delete()
          .eq('id', key_id)
          .eq('doctor_id', params.id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('POST webhooks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
