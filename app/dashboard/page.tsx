import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { Plus, Clock, CheckCircle, Search, Euro, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { RecentCasesTable } from "@/components/dashboard/RecentRecommendationsTable";
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const supabase = createServerSupabaseClient();
  const t = await getTranslations('hc');
  const { data: { user } } = await supabase.auth.getUser();

  let practiceData = { name: "Doctor Practice" };
  let activeRecommendations = 0;
  let pendingResults = 0;
  let completedRecommendations = 0;
  let totalSpendValue = 0;
  let recommendationsData: any[] = [];
  let activity: any[] = [];

  if (user) {
    const { data } = await supabase
      .from("doctor_practice")
      .select("name")
      .eq("id", user.id)
      .single();
    if (data) practiceData = data;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count: activeCount } = await supabaseAdmin
      .from("recommendation")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", user.id)
      .not("status", "in", '("completed","cancelled")');
    if (activeCount !== null) activeRecommendations = activeCount;

    const { count: pendingCount } = await supabaseAdmin
      .from("recommendation")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", user.id)
      .in("status", ["at_lab"]); 
    if (pendingCount !== null) pendingResults = pendingCount;

    const { count: completedCount } = await supabaseAdmin
      .from("recommendation")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", user.id)
      .eq("status", "completed");
    if (completedCount !== null) completedRecommendations = completedCount;

    const { data: recList } = await supabaseAdmin
      .from("recommendation")
      .select(`
        id, created_at, urgency_level, mobility, status, test_types,
        patient:patient_id ( first_name, last_name )
      `)
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recList) recommendationsData = recList;

    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (notifications) {
      activity = notifications.map(n => ({
        time: n.created_at,
        text: n.title,
        message: n.message,
        type: n.type
      }));
    }
  }

  const mappedRecommendations = recommendationsData.map(c => {
    const p = c.patient as any;
    const patientName = p ? `${p.first_name} ${p.last_name}` : "Unknown Patient";
    const testTypeArray = Array.isArray(c.test_types) ? c.test_types : [];
    
    return {
      id: c.id,
      patientName,
      status: c.status,
      testsCount: testTypeArray.length,
      total: 0, // Pending pricing logic
      created_at: c.created_at
    };
  });

  return (
    <div className="flex-1 min-w-0 w-full">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">
              {t('dashboard.title', { fallback: "Dashboard" })}
            </h1>
            <p className="text-[13px] sm:text-[15px] text-gray-500 m-0">
              {t('dashboard.welcome', { name: practiceData?.name || "Doctor Practice", fallback: `Welcome, ${practiceData?.name}` })}
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

      <div className="grid metric-grid md:flex md:flex-row gap-4 mb-8">
        <MetricCard icon={<Clock />} label={t('dashboard.totalRecommendations', { fallback: "Total Recommendations" })} value={activeRecommendations + completedRecommendations} />
        <MetricCard icon={<Search />} label={t('dashboard.pendingResults', { fallback: "Pending Results" })} value={pendingResults} />
        <MetricCard icon={<CheckCircle />} label={t('dashboard.completed', { fallback: "Completed" })} value={completedRecommendations} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <RecentCasesTable recommendations={mappedRecommendations} />

        <div className="bg-white rounded-[16px] border border-gray-200 p-5 self-start">
          <h2 className="font-heading text-base font-medium text-near-black mb-5">{t('dashboard.recentActivity', { fallback: "Recent Activity" })}</h2>
          <div className="flex flex-col">
            {activity.length > 0 ? activity.map((a, i) => {
              const Icon = FileText;
              return (
                <div key={i} className={`flex gap-3.5 py-3.5 ${i < activity.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-blue-50`}>
                    <Icon className={`w-4 h-4 text-blue-600`} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-near-black leading-snug">{a.text}</div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      {new Date(a.time).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-[13px] text-gray-500 font-medium max-w-[200px] mx-auto leading-relaxed">
                  {t('dashboard.noActivity', { fallback: "No recent activity" })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, variant = 'default' }: any) {
  const isSuccess = variant === 'success';
  return (
    <div className="bg-white rounded-[16px] p-3 sm:p-5 lg:p-6 border border-gray-200 flex-1 min-w-0 transition-shadow">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 ${
          isSuccess ? 'bg-[#008085]/10 text-[#008085] border border-[#008085]/20' : 'bg-gray-50 text-primary border border-gray-100'
        }`}>
          {icon}
        </div>
      </div>
      <div className="font-heading text-[24px] sm:text-[32px] lg:text-[36px] font-medium text-near-black tracking-tight leading-none mb-1.5">
        {value}
      </div>
      <div className="font-body text-[11px] sm:text-[13px] lg:text-[14px] font-normal text-gray-500">
        {label}
      </div>
    </div>
  );
}
