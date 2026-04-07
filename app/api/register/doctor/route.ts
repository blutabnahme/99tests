export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotificationForAdmins } from '@/lib/notifications-helper';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
 try {
 const { userId, email, companyName, companyType, phone, street, city, zip, taxId, fileUrl } = await request.json();

 if (!userId || !email || !companyName) {
 return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
 }

 // Insert Doctor profile
 const { error: hcError } = await supabaseAdmin.from("doctor_practice").insert({
 id: userId,
 name: companyName,
 contact_email: email,
 phone: phone,
 type: companyType,
 address: { street, city, zip, tax_id: taxId },
 status: "pending",
 });

 if (hcError) {
 console.error("Doctor Creation Error:", hcError);
 return NextResponse.json({ error: `Failed to create company profile: ${hcError.message}` }, { status: 500 });
 }

 // Insert Document if provided
 if (fileUrl) {
 const { error: docError } = await supabaseAdmin.from("verification_document").insert({
 user_id: userId,
 document_type: "license",
 file_url: fileUrl,
 status: "pending",
 });

 if (docError) {
 console.error("Doc Error:", docError);
 return NextResponse.json({ error: `Recorded Doctor but failed document: ${docError.message}` }, { status: 500 });
 }
 }

 await createNotificationForAdmins({
 type: 'system_alert',
 title: 'New Doctor Registration',
 message: `${companyName} has registered and is pending verification.`,
 link: '/admin/verifications'
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 console.error("Registration Proxy Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
