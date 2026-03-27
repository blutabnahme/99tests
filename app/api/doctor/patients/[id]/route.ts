export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ownership by checking if Doctor has any recommendations mapped to this patient
    const { data: recommendations, error: recommendationErr } = await supabaseAdmin
      .from("recommendation")
      .select("id")
      .eq("doctor_id", user.id)
      .eq("patient_id", id)
      .limit(1);

    if (recommendationErr || !recommendations || recommendations.length === 0) {
      return NextResponse.json({ error: "Patient not found or unauthorized access" }, { status: 403 });
    }

    // Process update
    const {
      first_name, last_name, contact_email, phone, gender, date_of_birth,
      address, insurance_type
    } = body;

    const { data: updatedPatient, error: updateErr } = await supabaseAdmin
      .from("patient")
      .update({
        first_name,
        last_name,
        contact_email,
        phone,
        gender,
        date_of_birth: date_of_birth || null,
        address,
        insurance_type
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      console.error("Patient update error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, patient: updatedPatient });
  } catch (error: any) {
    console.error("PUT /api/doctor/patients/[id] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
