import { createClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { CalendarDays } from "lucide-react";
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function BCRequestsPage() {
 const t = await getTranslations('hc.bcRequests');
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (user?.user_metadata?.role !== "blood_collector") {
 redirect("/dashboard");
 }

 // Fetch pending appointments
 const { data: appointments } = await supabase
 .from("appointment")
 .select(`
 *,
 case:recommendation_id (
 id, urgency_level, mobility, test_types, estimated_fees, special_case_flags,
 doctor_practice:doctor_id ( name )
 ),
 patient:patient_id ( first_name, last_name, address, date_of_birth )
 `)
 .eq("bc_id", user.id)
 .eq("status", "pending_bc_confirmation")
 .order("created_at", { ascending: false });

 return (
 <div className="flex-1 min-w-0 w-full">
 <div className="flex items-center gap-4 mb-8">
 <div className="w-12 h-12 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-center">
 <CalendarDays className="w-6 h-6 text-amber-600" />
 </div>
 <div>
 <h1 className="font-heading text-3xl font-medium text-near-black tracking-tight mb-1">
 {t('title')}
 </h1>
 <p className="text-[14px] text-gray-500 m-0">
 {t('subtitle')}
 </p>
 </div>
 </div>

 {(!appointments || appointments.length === 0) ? (
 <div className="text-center p-12 bg-white rounded-[20px] border border-gray-200">
 <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="font-heading text-xl font-medium text-near-black mb-2">{t('noRequestsTitle')}</h3>
 <p className="text-[15px] text-gray-500">{t('noRequestsDesc')}</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {appointments.map((apt) => (
 <RequestCard key={apt.id} appointment={apt} />
 ))}
 </div>
 )}
 </div>
 );
}
