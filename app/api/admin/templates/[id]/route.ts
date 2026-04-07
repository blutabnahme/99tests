export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
 request: Request,
 { params }: { params: { id: string } }
) {
 try {
 const id = params.id;
 if (!id) {
 return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
 }

 const payload = await request.json();

 const { error } = await supabaseAdmin
 .from('notification_template')
 .update({
 subject_en: payload.subject_en,
 subject_de: payload.subject_de,
 subject_es: payload.subject_es,
 subject_nl: payload.subject_nl,
 subject_fr: payload.subject_fr,
 body_en: payload.body_en,
 body_de: payload.body_de,
 body_es: payload.body_es,
 body_nl: payload.body_nl,
 body_fr: payload.body_fr,
 send_email: payload.send_email,
 send_sms: payload.send_sms,
 send_in_app: payload.send_in_app,
 send_whatsapp: payload.send_whatsapp,
 updated_at: new Date().toISOString()
 })
 .eq('id', id);

 if (error) {
 console.error('Error updating template:', error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 return NextResponse.json({ success: true });
 } catch (err: any) {
 console.error('Unexpected error in PUT /api/admin/templates/[id]:', err.message);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
