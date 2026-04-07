import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
 request: Request,
 { params }: { params: { token: string } }
) {
 const { token } = params;
 if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

 try {
 const { shipping_address, billing_address } = await request.json();

 const { data: tokenRecord, error: tokenError } = await supabaseAdmin
 .from('tt_patient_token')
 .select('recommendation_id, is_used, expires_at')
 .eq('token', token)
 .single();

 if (tokenError || !tokenRecord || tokenRecord.is_used || new Date(tokenRecord.expires_at) < new Date()) {
 return NextResponse.json({ error: 'Invalid or expired magic link' }, { status: 403 });
 }

 const { error: recUpdateErr } = await supabaseAdmin
 .from('tt_recommendation')
 .update({ shipping_address, billing_address })
 .eq('id', tokenRecord.recommendation_id);

 if (recUpdateErr) throw recUpdateErr;

 return NextResponse.json({ success: true });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
