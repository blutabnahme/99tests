export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createDirectSession } from '@/lib/patient-auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { patient_token } = await request.json();

    if (!patient_token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the recommendation by magic link token
    const { data: rec } = await supabaseAdmin
      .from('tt_recommendation')
      .select('patient_id')
      .eq('magic_link', patient_token)
      .single();

    if (!rec?.patient_id) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const ip = request.headers.get('x-forwarded-for') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const session = await createDirectSession(rec.patient_id, ip, userAgent);

    if (!session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('patient_session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: session.expiresAt,
    });

    return response;
  } catch (error: any) {
    console.error('[Portal] Create session from payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
