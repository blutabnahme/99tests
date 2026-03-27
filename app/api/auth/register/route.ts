import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      practiceName,
      specialty,
      licenseNumber,
      phone,
      street,
      zip,
      city,
      country,
      verificationDocumentUrl
    } = body;

    // Validate required fields
    if (!email || !password || !fullName || !practiceName) {
      return NextResponse.json(
        { error: 'Missing required configuration fields.' },
        { status: 400 }
      );
    }

    // 1. Create the user in Supabase Auth using the admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for this flow, adjust if email verification is needed
      user_metadata: {
        role: 'doctor',
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth Error:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user account.' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Insert into tt_doctor schema
    const { error: dbError } = await supabaseAdmin
      .from('tt_doctor')
      .insert([
        {
          user_id: userId,
          email,
          full_name: fullName,
          practice_name: practiceName,
          specialty: specialty || null,
          license_number: licenseNumber || null,
          phone: phone || null,
          address_street: street || null,
          address_zip: zip || null,
          address_city: city || null,
          address_country: country || 'Deutschland',
          is_verified: false,
          verification_document_url: verificationDocumentUrl || null,
          is_active: true
        }
      ]);

    if (dbError) {
      console.error('DB Insert Error:', dbError);
      
      // Rollback auth user creation if db insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: dbError.message || 'Failed to initialize doctor profile.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, userId });

  } catch (err: any) {
    console.error('Registration API Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
