export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getHcContext() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, hcId: null, authError: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: hcData } = await supabaseAdmin
    .from('doctor_practice')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!hcData) {
    return { user, hcId: null, authError: NextResponse.json({ error: 'Forbidden. No associated Healthcare Company found.' }, { status: 403 }) };
  }

  return { user, hcId: hcData.id, authError: null };
}

export async function GET(request: Request) {
  try {
    const { hcId, authError } = await getHcContext();
    if (authError) return authError;
    if (!hcId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: keys } = await supabaseAdmin
      .from('api_key')
      .select('id, name, key_prefix, status, last_used_at, expires_at, created_at, revoked_at')
      .eq('doctor_id', hcId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ keys: keys || [] });
  } catch (error) {
    console.error('[API_KEYS_GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, hcId, authError } = await getHcContext();
    if (authError) return authError;
    if (!user || !hcId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name } = body;

    const { count } = await supabaseAdmin
      .from('api_key')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', hcId)
      .eq('status', 'active');

    if (count !== null && count >= 5) {
      return NextResponse.json({ error: 'Maximum of 5 active API keys allowed.' }, { status: 400 });
    }

    const rawKey = `hm_sk_${crypto.randomBytes(24).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const { data: newKey, error } = await supabaseAdmin
      .from('api_key')
      .insert({
        doctor_id: hcId,
        name: name || 'Default',
        key_prefix: keyPrefix,
        key_hash: keyHash,
        status: 'active',
        created_by: user.id
      })
      .select('id, name, key_prefix, status, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ key: newKey, rawKey }, { status: 201 });
  } catch (error) {
    console.error('[API_KEYS_POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { hcId, authError } = await getHcContext();
    if (authError) return authError;
    if (!hcId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { keyId, action } = body;

    if (!keyId || action !== 'revoke') {
        return NextResponse.json({ error: 'Invalid action or missing keyId.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('api_key')
      .update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .eq('id', keyId)
      .eq('doctor_id', hcId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_KEYS_PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
