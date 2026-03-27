export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { createNotificationForAdmins } from '@/lib/notifications-helper';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Fetch pending and rejected HCs
    const { data: hcsResult, error: hcErr } = await supabaseAdmin
      .from('doctor_practice')
      .select('id, name, contact_email, phone, address, type, created_at, status, rejection_reason, rejected_at')
      .in('status', ['pending', 'rejected'])
      .order('created_at', { ascending: false });

    console.log('[VERIF DEBUG] Doctor query:', hcsResult?.length, 'error:', hcErr);

    // Fetch pending and rejected BCs
    const { data: bcsResult, error: bcErr } = await supabaseAdmin
      .from('blood_collector')
      .select('id, first_name, last_name, contact_email, qualification, phone, service_area, offers_home_visits, offers_practice_visits, practice_fee, home_visit_fee, created_at, status, rejection_reason, rejected_at')
      .in('status', ['pending', 'rejected'])
      .order('created_at', { ascending: false });

    console.log('[VERIF DEBUG] BC query:', bcsResult?.length, 'error:', bcErr);

    const signUrl = async (path: string) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;

      // 3600 seconds = 1 hour expiration as requested
      const { data } = await supabaseAdmin.storage.from("verification_documents").createSignedUrl(path, 3600);
      return data?.signedUrl || null;
    };

    const processUsers = async (users: any[]) => {
      return Promise.all((users || []).map(async (u) => {
        const { data: docs } = await supabaseAdmin
          .from('verification_document')
          .select('id, document_type, file_url, created_at')
          .eq('user_id', u.id);

        const signedDocs = await Promise.all((docs || []).map(async (d: any) => ({
          ...d,
          url: await signUrl(d.file_url)
        })));
        return { ...u, signedDocs };
      }));
    };

    const [hcs, bcs] = await Promise.all([
      processUsers(hcsResult || []),
      processUsers(bcsResult || [])
    ]);

    return NextResponse.json({ hcs, bcs });
  } catch (err: any) {
    console.error("GET verifications error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const body = await request.json();
    const { action, userId, type, reasons, notes } = body;
    const table = type === 'hc' ? 'doctor_practice' : 'blood_collector';

    if (action === 'approve') {
      const { error } = await supabaseAdmin
        .from(table)
        .update({ status: 'active', rejection_reason: null, rejected_at: null })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      
      await createNotificationForAdmins({
        type: 'system_alert',
        title: 'User Verified',
        message: `Admin ${user.email} verified ${type.toUpperCase()} user ${userId}.`,
        link: '/admin/users'
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'reject') {
      const rejectionPayload = JSON.stringify({ reasons: reasons || [], notes: notes || '' });
      const { error } = await supabaseAdmin
        .from(table)
        .update({ 
          status: 'rejected', 
          rejection_reason: rejectionPayload, 
          rejected_at: new Date().toISOString() 
        })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      
      await createNotificationForAdmins({
        type: 'system_alert',
        title: 'User Rejected',
        message: `Admin ${user.email} rejected ${type.toUpperCase()} user ${userId}.`,
        link: '/admin/verifications'
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'reset_to_pending') {
      const { error } = await supabaseAdmin
        .from(table)
        .update({ status: 'pending', rejection_reason: null, rejected_at: null })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error("POST verifications error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
