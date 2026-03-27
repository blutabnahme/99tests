import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { DollarSign, Activity, FileText, Download, Briefcase, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import InvoiceHistoryTable from "./InvoiceHistoryTable";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

function MetricCard({ icon: Icon, label, value, trend, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-5 lg:p-6 border border-gray-200 flex-1 min-w-0 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-current" />
        </div>
        {trend && (
          <span className="hidden sm:inline-flex text-[12px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="font-heading text-[24px] sm:text-[28px] lg:text-[32px] font-medium text-near-black tracking-tight leading-none mb-1">{value}</div>
      <div className="text-[11px] sm:text-[12px] text-gray-500">{label}</div>
    </div>
  );
}

export default async function HCBillingPage() {
  const t = await getTranslations('hc.billing');
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: hcUser } = await supabase
    .from('doctor_practice')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (!hcUser) redirect('/dashboard');

  const hcId = hcUser.id;

  const { createClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch Invoices and their linked payments -> recommendations
  const { data: invoices } = await supabaseAdmin
    .from('doctor_invoice')
    .select(`
      *,
      payment(
         id, patient_amount, vat_amount, paid_at,
         appointment(type),
         recommendation(id, test_types, patient(first_name, last_name))
      )
    `)
    .eq('doctor_id', hcId)
    .order('period_end', { ascending: false });

  // 2. Aggregate Metrics
  let lifetimeSpend = 0;
  let outstandingBalance = 0;

  const tableInvoices = invoices?.map((inv: any) => {
     if (inv.status === 'paid') lifetimeSpend += inv.total_amount;
     if (inv.status === 'pending' || inv.status === 'overdue') outstandingBalance += inv.total_amount;

     const payments = inv.payment ? inv.payment.map((p: any) => {
        const c = Array.isArray(p.case) ? p.case[0] : p.case;
        const apt = Array.isArray(p.appointment) ? p.appointment[0] : p.appointment;
        const pt = c ? (Array.isArray(c.patient) ? c.patient[0] : c.patient) : null;

        return {
           id: p.id,
           date: p.paid_at || inv.period_end,
           patientName: pt ? `${pt.first_name} ${pt.last_name}` : 'Unknown',
           visitType: apt?.type || 'practice',
           tests: c?.test_types?.join(', ') || '',
           subtotal: p.patient_amount - p.vat_amount,
           vat: p.vat_amount,
           total: p.patient_amount
        };
     }) : [];

     // Sort payments recursively inside the invoice by date
     payments.sort((a: any,b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

     return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        period_start: inv.period_start,
        period_end: inv.period_end,
        case_count: inv.case_count,
        org_fees_total: inv.org_fees_total,
        material_fees_total: inv.material_fees_total,
        logistics_fees_total: inv.logistics_fees_total,
        subtotal: inv.subtotal,
        vat: inv.vat_amount,
        total: inv.total_amount,
        status: inv.status,
        payments
     };
  }) || [];

  if (lifetimeSpend === 0) {
    const { data: allHcCases } = await supabaseAdmin.from('recommendation').select('id').eq('doctor_id', hcId);
    const allCaseIds = allHcCases ? allHcCases.map((c: any) => c.id) : [];
    if (allCaseIds.length > 0) {
      const { data: allPayments } = await supabaseAdmin
        .from('payment')
        .select('b2b_fee, material_revenue, logistics_revenue')
        .in('recommendation_id', allCaseIds);
      if (allPayments) {
        const rawTotal = allPayments.reduce((sum: number, p: any) => {
          return sum + Number(p.b2b_fee || 0) + Number(p.material_revenue || 0) + Number(p.logistics_revenue || 0);
        }, 0);
        lifetimeSpend = rawTotal * 1.19;
      }
    }
  }

  // 3. Current Running Period 
  // Fetch payments that occur in current month AND don't have an invoice assigned
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: currentPeriodPayments } = await supabaseAdmin
    .from('payment')
    .select(`
       id, patient_amount, vat_amount,
       appointment(type),
       recommendation!inner(doctor_id)
    `)
    .eq('recommendation.doctor_id', hcId)
    .is('doctor_invoice_id', null)
    .gte('paid_at', currentMonthStart);

  // Fetch Platform Config
  const { data: configData } = await supabaseAdmin.from('platform_config').select('*');
  const platformConfig = (configData || []).reduce((acc: any, row: any) => {
    acc[row.id] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    return acc;
  }, {} as Record<string, any>);

  let currentCases = 0;
  let currentOrgFees = 0;
  let currentMaterialFees = 0;
  let currentLogistics = 0;
  let currentSubtotal = 0;
  let currentVat = 0;

  // Simplified running org math 
  currentPeriodPayments?.forEach((p: any) => {
    currentCases++;
    const apt = Array.isArray(p.appointment) ? p.appointment[0] : p.appointment;
    const visitType = apt?.type || 'practice';

    const orgRate = visitType === 'home_visit'
      ? Number(platformConfig.fees?.home_org_fee || 35.0)
      : Number(platformConfig.fees?.practice_org_fee || 20.0);
    currentOrgFees += orgRate;
  });

  currentSubtotal = currentOrgFees + currentMaterialFees + currentLogistics;
  currentVat = currentSubtotal * (Number(platformConfig.tax?.vat_rate_pct || 19) / 100);

  const projectedTotal = currentSubtotal + currentVat;

  return (
    <div className="flex-1 min-w-0 w-full font-body">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight">{t('index.title')}</h1>
        <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1">{t('index.subtitle')}</p>
      </div>

      {/* Metrics Row */}
      <div className="grid metric-grid md:grid-cols-4 gap-5 mb-4 sm:mb-6">
        <MetricCard 
          icon={Activity} 
          label={t('index.metrics.thisMonth')} 
          value={`€${projectedTotal.toFixed(2)}`} 
          color="bg-blue-50 text-blue-600 border border-blue-100"
        />
        <MetricCard 
          icon={AlertCircle} 
          label={t('index.metrics.outstanding')} 
          value={`€${outstandingBalance.toFixed(2)}`} 
          trend={outstandingBalance > 0 ? t('index.metrics.actionRequired') : t('index.metrics.allClear')}
          color={outstandingBalance > 0 ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}
        />
        <MetricCard 
          icon={Briefcase} 
          label={t('index.metrics.casesThisMonth')} 
          value={currentCases} 
          trend={t('index.metrics.unbilled')}
          color="bg-purple-50 text-purple-600 border border-purple-100"
        />
        <MetricCard 
          icon={DollarSign} 
          label={t('index.metrics.lifetimeSpend')} 
          value={`€${lifetimeSpend.toFixed(2)}`} 
          color="bg-gray-50 text-gray-600 border border-gray-200"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
        
        {/* Left Col: Invoice Table */}
        <div className="xl:col-span-2 space-y-8">
           <InvoiceHistoryTable invoices={tableInvoices} />
        </div>

        {/* Right Col: Unbilled Tally & Payments */}
        <div className="space-y-8">
           
           {/* Current Period Card */}
           <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="font-heading text-[18px] font-medium text-near-black">{t('index.tally.title')}</h2>
                 <span className="text-[12px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">{t('index.tally.live')}</span>
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-[13px]">
                     <span className="text-gray-500">{t('index.tally.orgFees')}</span>
                     <span className="font-medium text-near-black">€{currentOrgFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                     <span className="text-gray-500">{t('index.tally.materials')}</span>
                     <span className="font-medium text-near-black">€{currentMaterialFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                     <span className="text-gray-500">{t('index.tally.logistics')}</span>
                     <span className="font-medium text-near-black">€{currentLogistics.toFixed(2)}</span>
                  </div>
                  
                  <div className="my-4 border-t border-gray-200" />
                  
                  <div className="flex justify-between items-center text-[14px] text-gray-500">
                     <span>{t('index.tally.subtotal')}</span>
                     <span className="font-medium text-near-black">€{currentSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px] text-gray-500">
                     <span>{t('index.tally.vat')}</span>
                     <span className="font-medium text-near-black">€{currentVat.toFixed(2)}</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-end">
                     <div>
                       <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('index.tally.total')}</div>
                       <div className="font-heading text-[32px] font-medium text-primary-dark leading-none">€{(projectedTotal).toFixed(2)}</div>
                     </div>
                     <div className="text-[12px] text-gray-400 font-medium pb-1">{t('index.tally.unbilledCases', { count: currentCases })}</div>
                  </div>
               </div>
             </div>
           </div>

           {/* Payment Methods */}
           <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 line">
             <div className="flex items-center justify-between mb-5">
               <h2 className="font-heading text-[18px] font-medium text-near-black">{t('index.paymentMethods.title')}</h2>
             </div>
             <p className="text-[13px] text-gray-500 mb-6">
               {t('index.paymentMethods.subtitle')}
             </p>
             <Button variant="secondary" className="w-full flex justify-center items-center gap-2">
               <Plus className="w-4 h-4" /> {t('index.paymentMethods.addButton')}
             </Button>
           </div>

        </div>
      </div>

    </div>
  );
}
