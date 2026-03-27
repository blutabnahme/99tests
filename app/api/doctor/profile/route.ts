import { NextResponse } from 'next/server';
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !['doctor', 'doctor_practice'].includes(session.user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('tt_doctor')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error('Fetch Profile Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !['doctor', 'doctor_practice'].includes(session.user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const updateFields = {
      full_name: body.full_name,
      practice_name: body.practice_name,
      specialty: body.specialty,
      license_number: body.license_number,
      phone: body.phone,
      address_street: body.address_street,
      address_zip: body.address_zip,
      address_city: body.address_city,
      address_country: body.address_country
    };

    // Strip undefined from the payload to prevent DB validation breaks
    const cleanFields = Object.fromEntries(
      Object.entries(updateFields).filter(([_, v]) => v !== undefined)
    );

    const { data: profile, error } = await supabaseAdmin
      .from('tt_doctor')
      .update(cleanFields)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error('Update Profile Error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
