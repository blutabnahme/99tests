import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

async function getDoctorId() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doctor } = await supabaseAdmin
    .from('tt_doctor')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return doctor?.id || null;
}

export async function POST(
  request: Request,
  { params }: { params: { testId: string } }
) {
  const doctorId = await getDoctorId();
  if (!doctorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabaseAdmin
    .from('tt_doctor_favorite')
    .upsert({ doctor_id: doctorId, test_id: params.testId }, { onConflict: 'doctor_id,test_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { testId: string } }
) {
  const doctorId = await getDoctorId();
  if (!doctorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabaseAdmin
    .from('tt_doctor_favorite')
    .delete()
    .eq('doctor_id', doctorId)
    .eq('test_id', params.testId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
