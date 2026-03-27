import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText, Calendar, Clock, MapPin, UserSquare, Phone, Mail,
  Activity, Truck, Building2, Home, CreditCard, ChevronRight, CheckCircle2, UserCheck, AlertCircle, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PatientConsentCard, CopyConsentHeaderButton } from "@/components/dashboard/RecommendationCopyActions";
import { CaseApplicants } from "@/components/dashboard/RecommendationApplicants";
import HCConfirmationBanner from "@/components/dashboard/DoctorConfirmationBanner";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations('hc.caseDetail');

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch Recommendation Data securely by enforcing doctor_id = user.id
  const { data: recommendationObj } = await supabaseAdmin
    .from("recommendation")
    .select(`
      *,
      patient:patient_id (*),
      doctor_practice:doctor_id (id, name),
      case_application ( id, status, scheduling_status, bc_id, blood_collector:bc_id (*) ),
      appointment ( id, scheduled_at, status, type, location, bc_id, application_id )
    `)
    .eq("id", params.id)
    .eq("doctor_id", user.id)
    .single();

  if (!recommendationObj) {
    redirect("/dashboard/recommendations");
  }

  // 2. Fetch extra data (Payments)
  const { data: payments } = await supabaseAdmin
    .from("payment")
    .select("*")
    .eq("recommendation_id", recommendationObj.id)
    .order("created_at", { ascending: false });

  const patient = recommendationObj.patient;
  const pAddress = patient.address || {};
  const activeApp = (recommendationObj.case_application || []).find((a: any) => ['accepted', 'booked'].includes(a.status));
  const assignedBc = activeApp?.blood_collector as any;
  const caseAppointment = (recommendationObj.appointment || [])[0] || null;
  
  // Format Lab Groups safely from scattered DB columns
  const testRequirements = Array.isArray(recommendationObj.test_types) ? recommendationObj.test_types : [];
  
  const labsList = recommendationObj.preferred_laboratory 
    ? recommendationObj.preferred_laboratory.split(',').map((l: string) => l.trim()).filter(Boolean)
    : [];
  const fetchedMaterials = Array.isArray(recommendationObj.materials) ? recommendationObj.materials : [];
  
  const parsedLabGroups = labsList.length > 0 ? labsList.map((labName: string) => ({
    name: labName,
    materials: fetchedMaterials.filter((m: any) => m.laboratory === labName).map((m: any) => `${m.qty}x ${m.name}`)
  })) : [];
  
  // Status mapping for timeline
  const statuses = ["created", "matched", "pending_payment", "booked", "completed"];
  const statusLabels: Record<string, string> = {
    created: t('timeline.open'),
    matched: t('timeline.matched'),
    pending_payment: t('timeline.payment'),
    booked: t('timeline.booked'),
    completed: t('timeline.completed')
  };
  const currentStatusIndex = statuses.indexOf(recommendationObj.status) > -1 ? statuses.indexOf(recommendationObj.status) : 0;

  const activePayment = payments?.[0] || null;
  const showConfirmationBanner = recommendationObj.status === 'completed' && activePayment?.payout_status === 'pending_confirmation';
  const showConfirmedBadge = recommendationObj.status === 'completed' && activePayment?.payout_status === 'confirmed';

  return (
    <div className="flex-1 min-w-0 w-full font-body">
      {/* Breadcrumbs */}
      <div className="text-[13px] text-gray-500 font-medium mb-6 flex items-center gap-2">
        <Link href="/dashboard" className="hover:text-near-black transition-colors">{t('breadcrumb.dashboard')}</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/dashboard/recommendations" className="hover:text-near-black transition-colors">{t('breadcrumb.recommendations')}</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-near-black font-semibold">{recommendationObj.id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl font-medium text-near-black tracking-tight">
              {t('header.recommendationId', { id: recommendationObj.id })}
            </h1>
            <StatusBadge status={recommendationObj.status} />
            {recommendationObj.urgency_level === 'urgent' && <Badge variant="urgent">{t('header.urgent')}</Badge>}
          </div>
          <p className="text-[14px] text-gray-500 m-0 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> 
            {t('header.createdOn', { date: format(new Date(recommendationObj.created_at), "MMMM d, yyyy 'at' HH:mm") })}
          </p>
        </div>
      </div>

      {/* Horizontal Status Timeline */}
      <div className="mb-10 px-0">
        <div className="flex items-center justify-between relative mt-4">
          <div className="absolute top-1/2 left-[10%] right-[10%] h-[3px] bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
          <div 
            className={`absolute top-1/2 left-[10%] h-[3px] -z-10 -translate-y-1/2 transition-all duration-500 rounded-full ${recommendationObj.status === 'cancelled' ? 'bg-transparent' : 'bg-emerald-500'}`} 
            style={{ width: `${Math.max(0, currentStatusIndex * (100 / (statuses.length - 1)) - 10)}%` }}>
          </div>
          
          {statuses.map((step, idx) => {
            const isCancelled = recommendationObj.status === 'cancelled';
            const isCompleted = !isCancelled && idx < currentStatusIndex;
            const isCurrent = !isCancelled && idx === currentStatusIndex;
            const isFuture = isCancelled || idx > currentStatusIndex;
            
            let colorClass = "bg-white border-gray-200 text-gray-300";
            if (isCompleted) colorClass = "bg-primary-dark border-primary-dark text-white";
            else if (isCurrent) colorClass = "bg-emerald-500 border-emerald-500 text-white ring-4 ring-emerald-500/20";
            else if (isCancelled) colorClass = "bg-gray-100 border-gray-300 text-gray-400";
            
            return (
              <div key={step} className="flex flex-col items-center relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 mb-2 transition-colors ${colorClass}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                {isCancelled && idx === 2 ? (
                   <span className="text-[13px] font-extrabold text-[#008085] uppercase tracking-wider bg-[#FEF0F2] px-3 py-1 rounded-md absolute -bottom-9 whitespace-nowrap border border-[#008085]/20 shadow-sm">{t('timeline.cancelled')}</span>
                ) : (
                   <span className={`text-[13px] font-bold ${isFuture ? "text-gray-400" : "text-near-black"}`}>{statusLabels[step]}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showConfirmationBanner && (
        <HCConfirmationBanner 
          recommendationId={recommendationObj.id}
          collectorName={`${assignedBc?.first_name || 'Collector'} ${assignedBc?.last_name || ''}`}
          collectionDate={recommendationObj.completed_at || caseAppointment?.scheduled_at}
          deadlineDate={activePayment?.doctor_confirmation_deadline}
        />
      )}
      
      {showConfirmedBadge && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
             <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-emerald-900">{t('collectionConfirmed.title')}</div>
            <div className="text-[13px] text-emerald-700">{t('collectionConfirmed.desc')}</div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 parts width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Test Requirements & Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm flex flex-col">
              <h3 className="font-heading text-[15px] font-medium text-near-black mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
                <Activity className="w-[18px] h-[18px] text-primary-dark" />
                {t('requirements.title')}
              </h3>
              <div className="flex-1">
                {testRequirements.length > 0 ? (
                  <div className={parsedLabGroups.length > 0 ? "mb-5" : ""}>
                    {parsedLabGroups.length > 0 && <h4 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-2">{t('requirements.requestedTests')}</h4>}
                    <ul className="space-y-3">
                      {testRequirements.map((test: string, idx: number) => (
                        <li key={idx} className="text-[14px] text-near-black font-medium flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-dark"></div>
                          {test}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-500 italic mb-4">{t('requirements.generalDraw')}</p>
                )}

                {parsedLabGroups.length > 0 && (
                  <div className="space-y-4 border-t border-gray-200 pt-5">
                    <h4 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-2">{t('requirements.targetLabs')}</h4>
                    {parsedLabGroups.map((lab: any, idx: number) => (
                      <div key={idx}>
                        <div className="text-[13px] font-bold text-near-black">{lab.name}</div>
                        {lab.materials && lab.materials.length > 0 && (
                          <div className="text-[12px] text-gray-500 mt-1 flex gap-1">
                            <span className="font-semibold text-near-black">{t('requirements.materials')}</span>
                            {lab.materials.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm flex flex-col">
              <h3 className="font-heading text-[15px] font-medium text-near-black mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
                <Truck className="w-[18px] h-[18px] text-primary-dark" />
                {t('logistics.title')}
              </h3>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-500">{t('logistics.mobilityRequest')}</span>
                  <span className="text-[13px] font-semibold text-near-black flex items-center gap-1.5">
                    {recommendationObj.mobility === "home_visit" 
                      ? <><Home className="w-[14px] h-[14px] text-orange-500"/> {t('logistics.homeVisit')}</> 
                      : <><Building2 className="w-[14px] h-[14px] text-steel-500"/> {t('logistics.practice')}</>
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-500">{t('logistics.returnShipping')}</span>
                  <span className="text-[13px] font-semibold text-near-black capitalize">
                    {recommendationObj.return_logistics === 'platform' ? t('logistics.platformReturn') : t('logistics.hcReturn')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-500">{t('logistics.patientGender')}</span>
                  <span className="text-[13px] font-semibold text-near-black capitalize">{t(`patient.${patient.gender}`) || t('logistics.unspecified')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-500">{t('logistics.bcSelection')}</span>
                  {recommendationObj.bc_selection_mode === 'patient_decides' ? (
                    <span className="bg-blue-100 text-blue-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wide">{t('logistics.patientDecides')}</span>
                  ) : recommendationObj.bc_selection_mode === 'clinic_shortlist' ? (
                    <span className="bg-purple-100 text-purple-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wide">{t('logistics.clinicShortlist')}</span>
                  ) : recommendationObj.bc_selection_mode === 'clinic_approval' ? (
                    <span className="bg-orange-100 text-orange-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wide">{t('logistics.clinicApproval')}</span>
                  ) : (
                    <span className="text-[13px] font-semibold text-near-black capitalize">{recommendationObj.bc_selection_mode || t('logistics.manual')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned BC & Appointments or Applicant Pool */}
          {/* Assigned Collector & Appointment Component */}
          {(caseAppointment || ['matched', 'pending_payment', 'booked', 'paid', 'completed'].includes(recommendationObj.status)) && (
            <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm mb-6">
              <h3 className="font-heading text-[15px] font-medium text-near-black mb-5 pb-3 border-b border-gray-200 flex items-center gap-2">
                <ShieldCheck className="w-[18px] h-[18px] text-emerald-600" />
                {t('collector.title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">{t('collector.bcLabel')}</div>
                  {assignedBc ? (
                    <div className="flex items-center gap-3">
                      {assignedBc.avatar_url ? (
                        <img src={assignedBc.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold text-lg">
                          {assignedBc.first_name?.[0]}{assignedBc.last_name?.[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-[15px] font-semibold text-near-black">{assignedBc.first_name} {assignedBc.last_name}</div>
                        <div className="text-[13px] text-gray-500 mt-0.5">{t('collector.verifiedPro')}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[13px] text-gray-500 italic">{t('collector.waitingAssignment')}</div>
                  )}
                </div>

                <div>
                  <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">{t('collector.appointmentLabel')}</div>
                  {caseAppointment ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-[14px]">
                        <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="font-medium text-near-black">
                          {format(new Date(caseAppointment.scheduled_at), "EEEE, MMMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[14px]">
                        <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="font-medium text-near-black">
                          {format(new Date(caseAppointment.scheduled_at), "h:mm a")} — {format(new Date(new Date(caseAppointment.scheduled_at).getTime() + 60*60*1000), "h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[14px]">
                        {caseAppointment.status === 'completed' ? (
                          <span className="text-[12px] text-emerald-600 font-medium">{t('collector.collectionCompleted')}</span>
                        ) : caseAppointment.status === 'cancelled' ? (
                          <span className="text-[12px] text-red-500 font-medium">{t('collector.appointmentCancelled')}</span>
                        ) : (
                          <span className="text-[12px] text-gray-400 italic">{t('collector.confirmedAwaiting')}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[13px] text-gray-500 italic">{t('collector.notScheduled')}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Applicant Pool Component */}
          {(!caseAppointment && !['matched', 'booked', 'paid', 'completed'].includes(recommendationObj.status)) 
            || (recommendationObj.case_application && recommendationObj.case_application.length > 0) ? (
             <div>
               <CaseApplicants recommendationId={params.id} selectionMode={recommendationObj.bc_selection_mode} />
             </div>
          ) : null}

        </div>

        {/* Right Column (1 part width) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Patient Info Card */}
          <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm">
            <h3 className="font-heading text-[15px] font-medium text-near-black mb-5 border-b border-gray-200 pb-3 flex items-center justify-between">
              {t('patient.title')}
              <Link href={`/dashboard/patients/${patient.id}`} className="text-[12px] text-primary-dark hover:underline">{t('patient.viewProfile')}</Link>
            </h3>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-light text-primary-dark rounded-xl flex items-center justify-center font-bold text-lg border border-primary-light">
                {patient.first_name?.[0]}{patient.last_name?.[0]}
              </div>
              <div>
                <div className="text-[16px] font-bold text-near-black leading-tight">{patient.first_name} {patient.last_name}</div>
                <div className="text-[13px] text-gray-500 mt-0.5">
                  {t('patient.dob')} {patient.date_of_birth ? format(new Date(patient.date_of_birth), "dd.MM.yyyy") : "—"}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-[16px] h-[16px] text-gray-500 mt-0.5" />
                <a href={`mailto:${patient.contact_email}`} className="text-[13px] font-medium text-near-black break-all hover:text-primary-dark hover:underline transition-colors">
                  {patient.contact_email}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-[16px] h-[16px] text-gray-500 mt-0.5" />
                {patient.phone ? (
                  <a href={`tel:${patient.phone}`} className="text-[13px] font-medium text-near-black hover:text-primary-dark hover:underline transition-colors">
                    {patient.phone}
                  </a>
                ) : (
                  <span className="text-[13px] font-medium text-gray-500">—</span>
                )}
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-[16px] h-[16px] text-gray-500 mt-0.5" />
                <div className="text-[13px] font-medium text-near-black leading-snug">
                  {pAddress.street}<br/>
                  {pAddress.zip} {pAddress.city}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-slate-50 rounded-[16px] border border-slate-200 p-6">
            <h3 className="font-heading text-[15px] font-medium text-gray-500-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
              <CreditCard className="w-[18px] h-[18px]" />
              {t('billing.title')}
            </h3>
            
            {payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((pmt: any) => (
                  <div key={pmt.id} className="flex justify-between items-center text-[13px]">
                    <div>
                      <span className="block mb-1">
                        <Badge variant={pmt.status === 'succeeded' || pmt.status === 'completed' ? 'completed' : pmt.status === 'failed' ? 'cancelled' : 'pending'}>
                          {t('billing.paymentStatus', { status: pmt.status })}
                        </Badge>
                      </span>
                      <span className="text-gray-500 text-[11px]">{format(new Date(pmt.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <span className="font-medium text-lg font-heading text-near-black">€{Number(pmt.patient_amount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-gray-500-500 italic">{t('billing.noPayments')}</div>
            )}
          </div>

          {/* Standalone Patient Consent Link block */}
          <PatientConsentCard token={recommendationObj.id} />

        </div>
      </div>
    </div>
  );
}
