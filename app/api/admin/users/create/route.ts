export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    // 1. Get current user, verify role === 'admin'
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authErrorInit } = await supabaseClient.auth.getUser();
    
    if (authErrorInit || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json();
    const { 
      role, name, email, 
      companyName, companyType, phone,
      practiceFee, homeVisitFee,
      dateOfBirth, insuranceProvider, insuranceNumber, hcId,
      sendEmail
    } = body;

    // 3. Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 4. Generate temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12) + '!A1';

    // 5. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role, full_name: name }
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    const userId = authData.user.id;
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || ' ';

    // 6. Create role-specific record
    if (role === 'doctor_practice') {
      const { error: insertError } = await supabaseAdmin.from('doctor_practice').insert({
        id: userId,
        name: companyName,
        type: companyType?.toLowerCase() || 'practice',
        contact_email: email,
        phone: phone || null,
        status: 'active'
      });
      if (insertError) {
        // cleanup auth user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    }

    if (role === 'blood_collector') {
      const { error: insertError } = await supabaseAdmin.from('blood_collector').insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        contact_email: email,
        phone: phone || null,
        qualification: 'nurse', // fallback to pass schema requirement
        status: 'pending',
        practice_fee: practiceFee ? Number(practiceFee) : 0,
        home_visit_fee: homeVisitFee ? Number(homeVisitFee) : 0,
        base_fee: 0,
        travel_fee_per_km: 0,
        max_travel_distance_km: 15
      });
      if (insertError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    }

    if (role === 'patient') {
      // Patients often require an Doctor ID in this schema, fetching the first Doctor as fallback if not nullable
      let insertPayload: any = {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        contact_email: email,
        date_of_birth: dateOfBirth || '1990-01-01',
        phone: phone || '00000000',
        gender: 'unknown',
        address: {},
        insurance_type: insuranceProvider || null
      };

      if (hcId) {
        insertPayload.doctor_id = hcId;
      } else {
        const { data: hcData } = await supabaseAdmin.from('doctor_practice').select('id').limit(1).single();
        if (hcData) insertPayload.doctor_id = hcData.id;
      }

      const { error: insertError } = await supabaseAdmin.from('patient').insert(insertPayload);
      if (insertError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    }

    if (sendEmail) {
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      });
    }

    // 7. Return success
    return NextResponse.json({ success: true, userId, tempPassword, emailSent: sendEmail });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
