import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET() {
  // Get current doctor's ID from auth
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find doctor record
  const { data: doctor } = await supabaseAdmin
    .from('tt_doctor')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!doctor) return NextResponse.json([]);

  const { data } = await supabaseAdmin
    .from('tt_doctor_favorite')
    .select('test_id')
    .eq('doctor_id', doctor.id);

  return NextResponse.json(data || []);
}
