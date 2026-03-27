export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendTemplatedNotification } from '@/lib/notifications-helper';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { doctor_id: payload_hc_id, patientData, casePayload } = payload;

    // Securely get the authenticated user ID
    const { createServerClient } = await import('@supabase/ssr');
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    const supabaseSession = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.delete({ name, ...options }); },
        },
      }
    );
    const { data: { user } } = await supabaseSession.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Override whatever the frontend sent with the securely verified auth user ID
    const doctor_id = user.id;

    if (!patientData || !casePayload) {
      return NextResponse.json({ error: "Missing required payload data" }, { status: 400 });
    }

    // 1. Check if patient exists by email
    let patientId = null;
    const { data: existingPatient } = await supabaseAdmin
      .from('patient')
      .select('id')
      .eq('contact_email', patientData.email)
      .single();

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      // 2. Create Patient Auth User (Required by FK constraint to auth.users)
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: patientData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: 'patient' }
      });

      if (authError || !authData.user) {
        console.error("Recommendation Creation (Auth Error):", authError);
        return NextResponse.json({ error: `Failed to create patient auth user: ${authError?.message}` }, { status: 500 });
      }

      patientId = authData.user.id;

      // 3. Insert Patient Profile
      const { error: patientError } = await supabaseAdmin
        .from('patient')
        .insert({
          id: patientId,
          doctor_id,
          first_name: patientData.firstName,
          last_name: patientData.lastName,
          date_of_birth: patientData.dob,
          gender: patientData.gender || 'unknown',
          contact_email: patientData.email,
          phone: patientData.phone,
          address: patientData.address,
          insurance_type: patientData.insuranceType,
          guardian_names: patientData.guardianNames
        });

      if (patientError) {
        console.error("Recommendation Creation (Patient Error):", patientError);
        return NextResponse.json({ error: `Failed to register patient: ${patientError.message}` }, { status: 500 });
      }
    }

    // 4. Insert Recommendation
    const finalCasePayload = {
      ...casePayload,
      doctor_id: doctor_id, // Ensure the recommendation record uses the strictly verified Auth User ID
      patient_id: patientId
    };

    const { error: caseError } = await supabaseAdmin.from('recommendation').insert(finalCasePayload);

    if (caseError) {
      console.error("Recommendation Creation Error:", caseError);
      // Even if patient succeeded, we report error (in prod we might want to rollback the patient creation)
      return NextResponse.json({ error: `Failed to create the case: ${caseError.message}` }, { status: 500 });
    }

    // --- 5. Broadcast to Blood Collectors ---
    try {
      const { data: hcData } = await supabaseAdmin.from('doctor_practice').select('company_name').eq('id', doctor_id).single();
      const hcName = hcData?.company_name || 'Healthcare Provider';

      // Admin Template Dispatch
      const { data: admins } = await supabaseAdmin.auth.admin.listUsers();
      const adminUsers = admins?.users?.filter(u => u.user_metadata?.role === 'admin') || [];
      for (const admin of adminUsers) {
        await sendTemplatedNotification({
           slug: 'case_created',
           recipientId: admin.id,
           recommendationId: finalCasePayload.id,
           variables: { recommendation_id: finalCasePayload.id, doctor_name: hcName, visit_type: finalCasePayload.visit_type || 'regular', urgency: finalCasePayload.urgency || 'standard' },
           link: `/admin/recommendations/${finalCasePayload.id}`
        });
        
        if (['urgent', 'emergency'].includes(finalCasePayload.urgency)) {
          await sendTemplatedNotification({
             slug: 'urgent_case_created',
             recipientId: admin.id,
             recommendationId: finalCasePayload.id,
             variables: { recommendation_id: finalCasePayload.id, doctor_name: hcName, urgency: finalCasePayload.urgency, visit_type: finalCasePayload.visit_type || 'regular' },
             link: `/admin/recommendations/${finalCasePayload.id}`
          });
        }
        
        const has99TestsMaterials = finalCasePayload.laboratories?.some((lab: any) => lab.materials?.some((m: any) => m.platform_provides));
        if (has99TestsMaterials) {
          await sendTemplatedNotification({
             slug: 'material_shipping_needed',
             recipientId: admin.id,
             recommendationId: finalCasePayload.id,
             variables: { recommendation_id: finalCasePayload.id, doctor_name: hcName, material_list: 'Materials required from Platform' },
             link: `/admin/recommendations/${finalCasePayload.id}`
          });
        }
      }

      const { data: bcs } = await supabaseAdmin
        .from('blood_collector')
        .select('id')
        .eq('status', 'active');
      
      if (bcs && bcs.length > 0) {
        // Create match records for all active BCs
        const matchPayloads = bcs.map(bc => ({
          recommendation_id: finalCasePayload.id,
          bc_id: bc.id,
          status: 'available',
          rank: 0,
          score: 0
        }));
        
        await supabaseAdmin.from('match').insert(matchPayloads);
        
        // Create in-app notifications for each matched BC
        const notifPayloads = bcs.map(bc => ({
          user_id: bc.id,
          type: 'new_opportunity',
          title: 'New blood collection opportunity',
          message: 'A new recommendation is available near you. Tap to view and apply.',
          link: '/bc/opportunities',
          read: false
        }));
        
        await supabaseAdmin.from('notifications').insert(notifPayloads);
      }
    } catch (bcError) {
      console.error("BC Broadcast Error:", bcError);
      // Non-fatal, we continue to return recommendation success
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.json({ 
      success: true, 
      recommendationId: finalCasePayload.id,
      patientConsentUrl: `${baseUrl}/patient/${finalCasePayload.id}`
    });
  } catch (error: any) {
    console.error("Recommendation Creation Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
