import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
import { redirect } from "next/navigation";
// import { calculatePricing } from "@/lib/pricing";
const calculatePricing = (a: any, b: any) => ({ total: 0, platformFee: 0, bcPayout: 0, serviceFee: 0 });
import { ShieldCheck, CreditCard, Wallet, Lock, Activity, CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

// Haversine distance calculator
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default async function PatientCheckoutPage({
  params
}: {
  params: { token: string }
}) {
  const supabase = createServerSupabaseClient();
  const recommendationId = params.token;
  const t = await getTranslations('patient.checkout');

  const { data: recommendationData, error: recommendationErr } = await supabaseAdmin
    .from('recommendation')
    .select('*, patient(*), case_application(blood_collector(practice_fee, home_visit_fee, address))')
    .eq('id', recommendationId)
    .single();

  if (recommendationErr || !recommendationData) {
    console.error("[CHECKOUT] Recommendation Fetch Error:", recommendationErr);
    return <div className="p-10 text-center font-mono text-sm text-red-600">{t('errors.fetchFailed')}: {JSON.stringify(recommendationErr)}</div>;
  }

  // Ensure it's in the 'booked' state (or created/matched if skipping booking locally, but booking is required)
  if (recommendationData.status === 'paid' || recommendationData.status === 'completed') {
    redirect(`/patient/${recommendationId}/receipt`);
  }

  // Fetch Appointment
  const { data: appt, error: apptErr } = await supabaseAdmin
    .from('appointment')
    .select('*')
    .eq('recommendation_id', recommendationId)
    .single();

  if (apptErr) {
    console.error("[CHECKOUT] Appointment Fetch Error:", apptErr);
    // Don't strictly fail the page yet if appointment happens to be delayed, but log it explicitly
  }

  // Fetch ALL latest config
  const { data: configData } = await supabaseAdmin.from('platform_config').select('*');
  const platformConfig = (configData || []).reduce((acc, row) => {
    acc[row.id] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    return acc;
  }, {} as Record<string, any>);

  // Re-calculate the pricing explicitly via our engine
  const materialCost = recommendationData.material_logistics === 'platform' && recommendationData.materials 
    ? recommendationData.materials.reduce((sum: number, m: any) => sum + ((m.price_snapshot || 0) * (m.qty || 1)), 0)
    : 0;
    
  let bcCustomComm = undefined;
  let bcPracticeFee = undefined;
  let bcHomeVisitFee = undefined;
  let bcTravelFee = undefined;

  // Get active application the patient selected
  const activeApplication = recommendationData.case_application?.find((a:any) => a.blood_collector);
  if (activeApplication?.blood_collector) {
      bcPracticeFee = activeApplication.blood_collector.practice_fee;
      bcHomeVisitFee = activeApplication.blood_collector.home_visit_fee;
      
      // Travel fee = rate * distance
      const bcLat = activeApplication.blood_collector.address?.lat;
      const bcLng = activeApplication.blood_collector.address?.lng;
      const patLat = recommendationData.patient?.address?.lat;
      const patLng = recommendationData.patient?.address?.lng;
      
      const distance = calculateDistance(patLat, patLng, bcLat, bcLng) || 0;
      const rate = platformConfig.pricing?.travel_fee_per_km || 1.50;
      const isHome = recommendationData.mobility === "home" || recommendationData.mobility === "home_visit";
      bcTravelFee = isHome ? distance * rate : 0;
  }

  // TODO: 99Tests - removed 99Tests dependency
  // const pricing = calculatePricing({
  //   mobility: recommendationData.mobility,
  //   urgency: recommendationData.urgency_level,
  //   hasPlatformMaterials: recommendationData.material_logistics === 'platform',
  //   materialCost,
  //   returnLogisticsCount: recommendationData.return_logistics === 'platform' ? 1 : 0,
  //   platformConfig,
  //   bcCustomCommissionRate: bcCustomComm,
  //   bcPracticeFee,
  //   bcHomeVisitFee,
  //   bcTravelFee
  // });
  const pricing: any = { baseFee: 0, travelFee: 0, urgencySurcharge: 0, materialCost: 0, logisticsFee: 0, returnFee: 0, subtotal: 0, vat: 0, patientTotal: 0 };

  return (
    <div className="font-body text-near-black bg-gray-50 min-h-screen flex justify-center py-10 px-4">
      <div className="w-full max-w-[800px]">
        
        <div className="flex items-center gap-2 mb-8 justify-center">
           <div className="w-10 h-10 rounded-xl bg-primary-dark flex items-center justify-center shadow-sm">
             <Activity className="w-5 h-5 text-white" />
           </div>
           <span className="font-heading text-[22px] font-medium tracking-tight text-near-black">99Tests</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT: Payment Methods & Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
               <h2 className="font-heading text-[20px] font-medium text-near-black mb-1">{t('title')}</h2>
               <p className="text-[14px] text-gray-500 mb-6">{t('subtitle')}</p>
               
               <div className="space-y-4">
                 <label className="flex items-center justify-between p-4 rounded-xl border-2 border-primary bg-open-bg cursor-pointer transition-all">
                   <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary transition-colors">
                       <CreditCard className="w-[18px] h-[18px]" strokeWidth={2.5} />
                     </div>
                     <span className="text-[14px] font-medium text-near-black">{t('card')}</span>
                   </div>
                   <div className="w-[18px] h-[18px] rounded-full border-[5px] border-primary bg-white shrink-0 transition-all" />
                 </label>
                 
                 <label className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all">
                   <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 text-gray-500 transition-colors">
                       <Wallet className="w-[18px] h-[18px]" strokeWidth={2.5} />
                     </div>
                     <span className="text-[14px] font-medium text-near-black">{t('paypal')}</span>
                   </div>
                   <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 bg-white shrink-0 transition-all" />
                 </label>

                 <label className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all">
                   <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 text-gray-500 transition-colors">
                       <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={2.5} />
                     </div>
                     <span className="text-[14px] font-medium text-near-black">{t('sepa')}</span>
                   </div>
                   <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 bg-white shrink-0 transition-all" />
                 </label>
               </div>
            </div>

            <p className="text-[12px] text-gray-500 text-center flex items-center justify-center gap-1.5">
               <Lock className="w-3.5 h-3.5" /> {t('secureText')}
            </p>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="space-y-6">
             <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                <h3 className="font-heading text-[16px] font-medium text-near-black mb-4 pb-2 border-b border-gray-200">{t('orderSummary')}</h3>
                
                <div className="space-y-3 mb-6 relative z-10">
                   <div className="flex justify-between items-center">
                     <span className="text-[14px] text-gray-500 font-medium">{t('baseFee')} ({recommendationData.mobility.replace('_', ' ')})</span>
                     <span className="text-[14px] font-bold text-near-black">€{pricing.baseFee.toFixed(2)}</span>
                   </div>
                   {pricing.travelFee > 0 && (
                     <div className="flex justify-between items-center">
                       <span className="text-[14px] text-gray-500 font-medium">{t('travelAllowance')}</span>
                       <span className="text-[14px] font-bold text-near-black">€{pricing.travelFee.toFixed(2)}</span>
                     </div>
                   )}
                   {pricing.urgencySurcharge > 0 && (
                     <div className="flex justify-between items-center">
                       <span className="text-[14px] text-orange-600 font-bold">{t('urgencySurcharge')}</span>
                       <span className="text-[14px] font-bold text-orange-600">+€{pricing.urgencySurcharge.toFixed(2)}</span>
                     </div>
                   )}
                   {pricing.materialCost > 0 && (
                     <div className="flex justify-between items-center">
                       <span className="text-[14px] text-gray-500 font-medium">{t('labMaterials')}</span>
                       <span className="text-[14px] font-bold text-near-black">€{pricing.materialCost.toFixed(2)}</span>
                     </div>
                   )}
                   {pricing.logisticsFee > 0 && (
                     <div className="flex justify-between items-center">
                       <span className="text-[14px] text-gray-500 font-medium">{t('materialShipping')}</span>
                       <span className="text-[14px] font-bold text-near-black">€{pricing.logisticsFee.toFixed(2)}</span>
                     </div>
                   )}
                   {pricing.returnFee > 0 && (
                     <div className="flex justify-between items-center">
                       <span className="text-[14px] text-gray-500 font-medium">{t('returnLogistics')}</span>
                       <span className="text-[14px] font-bold text-near-black">€{pricing.returnFee.toFixed(2)}</span>
                     </div>
                   )}
                </div>

                <div className="pt-4 border-t border-gray-200 mb-2">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-[14px] text-gray-500 font-medium">{t('subtotal')}</span>
                     <span className="text-[14px] font-bold text-near-black">€{pricing.subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[14px] text-gray-500 font-medium">{t('vat', { pct: platformConfig.tax?.vat_rate_pct || 19 })}</span>
                     <span className="text-[14px] font-medium text-gray-500">€{pricing.vat.toFixed(2)}</span>
                   </div>
                </div>
                
                <div className="pt-4 mt-2 border-t-2 border-gray-900 border-dashed flex justify-between items-center">
                   <span className="font-heading text-[18px] font-medium text-near-black tracking-tight">{t('total')}</span>
                   <span className="font-heading text-[24px] font-medium text-primary-dark">€{pricing.patientTotal.toFixed(2)}</span>
                </div>
             </div>

             <CheckoutClient 
                recommendationId={recommendationId} 
                appointmentId={appt?.id}
                amount={pricing.patientTotal}
                pricingBreakdown={pricing} 
             />

          </div>

        </div>

      </div>
    </div>
  );
}
