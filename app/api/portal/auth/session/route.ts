export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession, destroySession } from '@/lib/patient-auth';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('patient_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    const patientId = await validateSession(sessionToken);

    if (!patientId) {
      return NextResponse.json({ authenticated: false });
    }

    // Fetch patient info
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: patient } = await supabaseAdmin
      .from('tt_patient')
      .select('id, first_name, last_name, email, phone')
      .eq('id', patientId)
      .single();

    return NextResponse.json({
      authenticated: true,
      patient: patient || { id: patientId },
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false });
  }
}

// Logout
export async function DELETE() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('patient_session')?.value;

    if (sessionToken) {
      await destroySession(sessionToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('patient_session');
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
