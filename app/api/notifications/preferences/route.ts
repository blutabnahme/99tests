import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

const DEFAULT_DOCTOR_TYPES = [
  'payment_received',
  'bank_transfer_confirmed',
  'kit_shipped',
  'results_ready',
];

const DEFAULT_ADMIN_TYPES = [
  'bank_transfer_pending',
  'payment_confirmed',
  'kit_shipped',
  'results_received',
  'new_doctor_registered',
];

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = user.user_metadata?.role;
  const defaultTypes = role === 'admin' ? DEFAULT_ADMIN_TYPES : DEFAULT_DOCTOR_TYPES;

  // Get existing preferences
  const { data: existing } = await supabaseAdmin
    .from('tt_notification_preference')
    .select('*')
    .eq('user_id', user.id);

  // Merge with defaults (create missing ones)
  const existingMap = new Map((existing || []).map((p: any) => [p.notification_type, p]));
  const preferences = defaultTypes.map(type => {
    if (existingMap.has(type)) {
      return existingMap.get(type);
    }
    return { user_id: user.id, notification_type: type, enabled: true };
  });

  return NextResponse.json({ preferences });
}

export async function PUT(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { preferences } = await request.json();

  for (const pref of preferences) {
    await supabaseAdmin
      .from('tt_notification_preference')
      .upsert({
        user_id: user.id,
        notification_type: pref.notification_type,
        enabled: pref.enabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,notification_type' });
  }

  return NextResponse.json({ success: true });
}
