import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { UserSquare, Plus, Mail, Phone, MapPin, Calendar, HeartPulse, Building2, Home, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ClickableRow } from "@/components/dashboard/ClickableRow";
import { PatientHeader } from "@/components/dashboard/PatientEditModal";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const t = await getTranslations('hc.patients');
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch recommendation history for THIS patient and THIS Doctor
  // Use admin client securely constrained by the current Doctor to bypass patient RLS boundary
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: caseHistory } = await supabaseAdmin
    .from("recommendation")
    .select(`
      id, created_at, status, mobility, test_types, urgency_level,
      case_application ( id, status, bc_id, blood_collector:bc_id ( first_name, last_name ) )
    `)
    .eq("doctor_id", user.id)
    .eq("patient_id", params.id)
    .order("created_at", { ascending: false });

  // If Doctor has no recommendations for this patient, deny access (redirect to patients list)
  if (!caseHistory || caseHistory.length === 0) {
    redirect("/dashboard/patients");
  }

  // 2. Fetch patient details using Admin client (bypassing strict origin Doctor RLS, 
  // since we already explicitly authorized them above by confirming shared recommendations)
  const { data: patient } = await supabaseAdmin
    .from("patient")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!patient) {
    redirect("/dashboard/patients");
  }

  const pAddress = patient.address || {};
  const fullAddress = [pAddress.street, pAddress.zip, pAddress.city].filter(Boolean).join(", ");

  return (
    <div className="flex-1 min-w-0 w-full font-body">
      
      {/* Breadcrumbs */}
      <div className="text-[13px] text-gray-500 font-medium mb-6 flex items-center gap-2">
        <Link href="/dashboard" className="hover:text-near-black transition-colors">{t('detail.dashboardLink')}</Link>
        <span className="text-gray-300">/</span>
        <Link href="/dashboard/patients" className="hover:text-near-black transition-colors">{t('detail.patientsLink')}</Link>
        <span className="text-gray-300">/</span>
        <span className="text-near-black font-semibold">{patient.first_name} {patient.last_name}</span>
      </div>

      {/* Header & Actions */}
      <PatientHeader patient={patient} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Patient Profile Details */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm">
            <h3 className="font-heading text-[15px] font-medium text-near-black mb-5 border-b border-gray-200 pb-3">{t('detail.profile.title')}</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-[18px] h-[18px] text-gray-500 mt-0.5" />
                <div>
                  <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">{t('detail.profile.email')}</div>
                  <div className="text-[14px] font-semibold text-near-black">{patient.contact_email}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-[18px] h-[18px] text-gray-500 mt-0.5" />
                <div>
                  <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">{t('detail.profile.phone')}</div>
                  <div className="text-[14px] font-semibold text-near-black">{patient.phone || "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-[18px] h-[18px] text-gray-500 mt-0.5" />
                <div>
                  <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">{t('detail.profile.gender')}</div>
                  <div className="text-[14px] font-semibold text-near-black capitalize">{patient.gender || "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-[18px] h-[18px] text-gray-500 mt-0.5" />
                <div>
                  <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">{t('detail.profile.dob')}</div>
                  <div className="text-[14px] font-semibold text-near-black">
                    {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMMM d, yyyy') : "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-[18px] h-[18px] text-gray-500 mt-0.5" />
                <div>
                  <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">{t('detail.profile.address')}</div>
                  <div className="text-[14px] font-medium text-near-black leading-snug">
                    {pAddress.street}<br/>
                    {pAddress.zip} {pAddress.city}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm">
            <h3 className="font-heading text-[15px] font-medium text-near-black mb-5 border-b border-gray-200 pb-3">{t('detail.medical.title')}</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <HeartPulse className="w-[18px] h-[18px] text-gray-500 mt-0.5" />
                <div>
                  <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">{t('detail.medical.insurance')}</div>
                  <div className="text-[14px] font-semibold text-near-black">{patient.insurance_type || t('detail.medical.noneSpecified')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Recommendation History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="pt-6 px-7 pb-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-[18px] font-medium text-near-black m-0">{t('detail.history.title')}</h3>
                <p className="text-[13px] text-gray-500 mt-0.5">{t('detail.history.subtitle')}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 text-gray-500 font-bold text-[14px] flex items-center justify-center border border-gray-200">
                {caseHistory.length}
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              {caseHistory.length > 0 ? (
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200">
                      <th className="px-7 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('detail.history.table.date')}</th>
                      <th className="px-7 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('detail.history.table.type')}</th>
                      <th className="px-7 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('detail.history.table.collector')}</th>
                      <th className="px-7 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('detail.history.table.mobility')}</th>
                      <th className="px-7 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('detail.history.table.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseHistory.map((c, i) => {
                      const applications = c.case_application || [];
                      const activeApp = applications.find((a: any) => ['accepted', 'booked'].includes(a.status));
                      const bc = activeApp?.blood_collector as any;
                      const applicationCount = applications.filter((a: any) => a.status !== 'withdrawn').length;
                      
                      const testStrs = Array.isArray(c.test_types) ? c.test_types : [];
                      const testLabel = testStrs.length > 0 ? `${testStrs[0]}${testStrs.length > 1 ? ` +${testStrs.length - 1}` : ''}` : 'General Draw';

                      return (
                        <ClickableRow 
                          key={c.id} 
                          id={c.id}
                          className={`hover:bg-gray-50 transition-colors ${i < caseHistory.length - 1 ? 'border-b border-gray-200' : ''}`}
                        >
                          <td className="px-7 py-4 text-[13px] font-medium text-near-black">
                            {format(new Date(c.created_at), 'MMM d, yyyy')}
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">{c.id}</div>
                          </td>
                          <td className="px-7 py-4">
                            <span className="text-[13px] font-medium text-near-black">{testLabel}</span>
                          </td>
                          <td className="px-7 py-4 text-[13px]">
                            {bc ? (
                              <span className="text-near-black font-medium">{bc.first_name} {bc.last_name}</span>
                            ) : applicationCount > 0 ? (
                              <span className="text-[12px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                {applicationCount} {applicationCount === 1 ? t('detail.history.applicantSingular') : t('detail.history.applicantPlural')}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[12px] italic">{t('detail.history.noApplicants')}</span>
                            )}
                          </td>
                          <td className="px-7 py-4">
                            <span className="text-[12px] text-gray-500 flex items-center gap-1">
                              {c.mobility === "home_visit" 
                                ? <Home className="w-3.5 h-3.5 text-orange-500" />
                                : <Building2 className="w-3.5 h-3.5 text-steel-500" />
                              }
                              {c.mobility === "home_visit" ? t('detail.history.homeVisit') : t('detail.history.practice')}
                            </span>
                          </td>
                          <td className="px-7 py-4">
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={c.status} />
                              {c.urgency_level === 'urgent' && <Badge variant="urgent">{t('detail.history.urgentBadge')}</Badge>}
                            </div>
                          </td>
                        </ClickableRow>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <UserSquare className="w-6 h-6 text-gray-400" />
                  </div>
                  <h4 className="text-[15px] font-medium text-near-black">{t('detail.history.empty.title')}</h4>
                  <p className="text-[13px] text-gray-500 mt-1 max-w-sm">
                    {t('detail.history.empty.desc')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
