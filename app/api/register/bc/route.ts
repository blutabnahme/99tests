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
 const { 
 userId, email, firstName, lastName, phone, 
 street, city, zip, qualification, 
 practiceFee, homeVisitFee, travelFee, maxDistance, fileUrl 
 } = await request.json();

 if (!userId || !email || !firstName || !lastName || !qualification) {
 return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
 }

 // Insert BC profile
 const { error: bcError } = await supabaseAdmin.from("blood_collector").insert({
 id: userId,
 first_name: firstName,
 last_name: lastName,
 contact_email: email,
 phone: phone,
 address: { street, city, zip },
 qualification: qualification,
 practice_fee: practiceFee,
 home_visit_fee: homeVisitFee,
 travel_fee_per_km: travelFee,
 max_travel_distance_km: maxDistance,
 status: "pending",
 });

 if (bcError) {
 console.error("BC Creation Error:", bcError);
 return NextResponse.json({ error: `Failed to create collector profile: ${bcError.message}` }, { status: 500 });
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
 return NextResponse.json({ error: `Recorded BC but failed document: ${docError.message}` }, { status: 500 });
 }
 }

 await createNotificationForAdmins({
 type: 'system_alert',
 title: 'New BC Registration',
 message: `A new blood collector has registered and is pending verification.`,
 link: '/admin/verifications'
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 console.error("Registration Proxy Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
