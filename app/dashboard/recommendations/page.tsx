import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { CasesOverviewTable } from "@/components/dashboard/RecommendationsOverviewTable";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function CasesIndexPage() {
  const supabase = createServerSupabaseClient();
  const t = await getTranslations('hc.recommendations');
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use admin client to reliably fetch relations (patients/BCs) created outside this Doctor's RLS scope,
  // strictly enforcing tenant isolation by equating doctor_id to the verified authenticated user.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch Recommendations with Joins
  const { data: casesList } = await supabaseAdmin
    .from("recommendation")
    .select(`
      id, created_at, urgency_level, mobility, status, test_types,
      patient:patient_id ( first_name, last_name ),
      case_application ( id, status, bc_id, blood_collector:bc_id ( first_name, last_name ) ),
      payment ( payout_status )
    `)
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false });

  console.log("--- CASES PAGE DEBUG ---");
  console.log("USER ID:", user.id);
  console.log("CASES COUNT RETURNED:", casesList ? casesList.length : 0);
  console.log("------------------------");

  const casesData = casesList || [];

  // Remap data for the Client Component Table
  const mappedCases = casesData.map(c => {
    const p = c.patient as any;
    const patientName = p ? `${p.first_name} ${p.last_name}` : t('unknownPatient', { fallback: "Unknown Patient" });
    const testTypeArray = Array.isArray(c.test_types) ? c.test_types : [];
    const testType = testTypeArray.length > 0 ? String(testTypeArray[0]) + (testTypeArray.length > 1 ? ` +${testTypeArray.length - 1}` : '') : "General Draw";
    
    const applicationCount = (c.case_application || []).filter((a: any) => a.status !== 'withdrawn').length;
    const activeApp = (c.case_application || []).find((a: any) => ['accepted', 'booked'].includes(a.status));
    const bc = activeApp?.blood_collector as any;
    const bcName = bc ? `${bc.first_name} ${bc.last_name}` : null;
    const payment = Array.isArray(c.payment) ? c.payment[0] : c.payment;
    const payoutStatus = payment?.payout_status || 'none';

    return {
      id: c.id,
      token: c.id,
      payoutStatus,
      patientName,
      testType,
      bcName,
      applicationCount,
      mobility: c.mobility,
      status: c.status,
      urgency_level: c.urgency_level,
      created_at: c.created_at
    };
  });

  return (
    <div className="flex-1 min-w-0 w-full">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">
              {t('title')}
            </h1>
            <p className="text-[13px] sm:text-[15px] text-gray-500 m-0">
              {t('subtitle')}
            </p>
          </div>
          <Link 
            href="/dashboard/recommendations/new"
            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white rounded-full px-5 py-2.5 text-[13px] font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.newRecommendation', { fallback: "New Recommendation" })}
          </Link>
        </div>
      </div>

      <CasesOverviewTable recommendations={mappedCases} />
    </div>
  );
}
