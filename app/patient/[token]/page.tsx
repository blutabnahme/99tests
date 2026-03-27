import { createClient } from "@supabase/supabase-js";
import { Home, Phone, MapPin, Building2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function PatientPortalPage({ params }: { params: { token: string } }) {
  const t = await getTranslations("patientPortal");
  const tk = await params.token;
  
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: recommendation } = await supabaseAdmin
    .from("recommendation")
    .select(`
      *,
      patient:patient_id (
        id, first_name, last_name, dob, gender, phone,
        address_street, address_city, address_postal_code, address_number
      ),
      doctor:doctor_id (
        name, phone_number,
        address_street, address_city, address_postal_code, address_number
      )
    `)
    .eq("id", tk)
    .single();

  if (!recommendation || !recommendation.patient) {
    notFound();
  }

  const p = recommendation.patient as any;
  const doc = recommendation.doctor as any;
  const isHomeVisit = recommendation.mobility === 'home_visit';

  return (
    <div className="font-body min-h-screen bg-gray-50 flex flex-col pt-6 sm:pt-10 pb-20 px-4">
      <div className="w-full max-w-[640px] mx-auto flex-1">
        
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="font-heading font-medium text-[20px] text-near-black">99Tests.de</span>
          </div>
          <StatusBadge status={recommendation.status} />
        </header>

        <main className="space-y-4">
          <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <h1 className="font-heading text-2xl font-medium text-near-black mb-1">
              Your Recommendation
            </h1>
            <p className="text-[15px] text-gray-500 mb-6">
              Referred by: {doc?.name || "Your Doctor"}
            </p>

            <div className="space-y-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-heading text-primary font-medium">{p.first_name[0]}{p.last_name[0]}</span>
                </div>
                <div>
                  <h2 className="font-semibold text-near-black text-[16px]">{p.first_name} {p.last_name}</h2>
                  <div className="text-[14px] text-gray-500 mt-0.5 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> 
                    {p.address_street} {p.address_number}, {p.address_city}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[13px]">Status</span>
                    <StatusBadge status={recommendation.status} />
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[13px]">Type</span>
                    <span className="text-near-black font-medium text-[13px]">
                       {isHomeVisit ? "Home Test Kit" : "Practice Visit"}
                    </span>
                 </div>
              </div>

              {recommendation.status !== "completed" && (
                <div className="pt-2">
                   <p className="text-[14px] text-primary-dark font-medium text-center">99Tests portal coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
