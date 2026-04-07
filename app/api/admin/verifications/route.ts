export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: doctors, error } = await supabaseAdmin
      .from('tt_doctor')
      .select('id, user_id, full_name, email, phone, practice_name, specialty, license_number, address_street, address_zip, address_city, address_country, is_active, verification_status, rejection_reason, verified_at, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ doctors: doctors || [] });
  } catch (error: any) {
    console.error('GET verifications error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { action, doctorId, reasons, notes } = body;

    if (!doctorId || !action) {
      return NextResponse.json({ error: 'doctorId and action are required' }, { status: 400 });
    }

    // Fetch the doctor
    const { data: doctor, error: fetchError } = await supabaseAdmin
      .from('tt_doctor')
      .select('id, user_id, full_name, email')
      .eq('id', doctorId)
      .single();

    if (fetchError || !doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    switch (action) {
      case 'approve': {
        await supabaseAdmin
          .from('tt_doctor')
          .update({
            is_active: true,
            verification_status: 'verified',
            verified_at: now,
            verified_by: user.id,
            rejection_reason: null,
          })
          .eq('id', doctorId);

        // Notify the doctor
        if (doctor.user_id) {
          await sendNotification({
            userId: doctor.user_id,
            title: 'Account Verified',
            message: 'Your 99Tests account has been verified. You can now create recommendations and use the full platform.',
            notificationType: 'account_verified',
            referenceId: doctor.id,
            referenceType: 'doctor',
          });
        }
        break;
      }

      case 'reject': {
        const rejectionReason = [
          ...(reasons || []),
          notes ? `Notes: ${notes}` : '',
        ].filter(Boolean).join('; ');

        await supabaseAdmin
          .from('tt_doctor')
          .update({
            is_active: false,
            verification_status: 'rejected',
            rejection_reason: rejectionReason,
          })
          .eq('id', doctorId);

        // Notify the doctor
        if (doctor.user_id) {
          await sendNotification({
            userId: doctor.user_id,
            title: 'Verification Update',
            message: `Your account verification requires attention. ${rejectionReason ? 'Reason: ' + rejectionReason : 'Please contact support for details.'}`,
            notificationType: 'account_rejected',
            referenceId: doctor.id,
            referenceType: 'doctor',
          });
        }
        break;
      }

      case 'reset_to_pending': {
        await supabaseAdmin
          .from('tt_doctor')
          .update({
            is_active: false,
            verification_status: 'pending',
            rejection_reason: null,
          })
          .eq('id', doctorId);
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST verifications error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
