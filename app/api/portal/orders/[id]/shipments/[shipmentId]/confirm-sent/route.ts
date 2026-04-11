import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/patient-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; shipmentId: string } }
) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('patient_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = await validateSession(sessionToken);
    
    if (!patientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the order belongs to this patient
    const { data: order } = await supabaseAdmin
      .from('tt_order')
      .select('id')
      .eq('id', params.id)
      .eq('patient_id', patientId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 403 });
    }

    // Update the shipment, specifically guarding that it correlates accurately against its order
    const { error } = await supabaseAdmin
      .from('tt_order_shipment')
      .update({ 
        status: 'patient_sent',
      })
      .eq('id', params.shipmentId)
      .eq('order_id', params.id)
      .eq('status', 'label_created'); // Guard restriction inside query filter!

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    // Trigger state derive node
    await supabaseAdmin.rpc('fn_derive_order_status', { p_order_id: params.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
