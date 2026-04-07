import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, FileText, Download, User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL || "",
 process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: { token: string } }) {
 const recommendationId = params.token;
 const t = await getTranslations('patient.receipt');

 // Fetch the Recommendation & Payment
 const { data: recommendationData, error: recommendationErr } = await supabaseAdmin
 .from('recommendation')
 .select('*, patient(*), appointment(id, payment(*))')
 .eq('id', recommendationId)
 .single();

 if (recommendationErr || !recommendationData || (recommendationData.status !== 'paid' && recommendationData.status !== 'completed')) {
 console.warn("[RECEIPT] Precondition failed:", { recommendationErr, caseStatus: recommendationData?.status });
 return <div className="p-10 text-center font-bold">{t('errors.notAvailable')}</div>;
 }

 // Determine latest payment record from the appointment relationship
 const appt = recommendationData.appointment?.[0] || recommendationData.appointment; // depending on relation cardinalities
 const paymentRecord = appt?.payment?.[0] || appt?.payment;



 return (
 <div className="font-body text-near-black bg-gray-50 min-h-screen flex justify-center py-10 px-4">
 <div className="w-full max-w-[600px]">
 
 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-center p-10 mb-6">
 <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-6">
 <CheckCircle2 className="w-10 h-10 text-emerald-600" />
 </div>
 <h1 className="font-heading text-[28px] font-medium tracking-tight text-near-black mb-2">{t('title')}</h1>
 <p className="text-[15px] text-gray-500 mb-8 max-w-[300px] mx-auto">
 {t('desc')}
 </p>

 <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-left mb-8">
 <div className="flex justify-between items-center mb-4">
 <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">{t('amountPaid')}</span>
 <span className="font-heading text-[24px] font-medium text-primary-dark">
 €{Number(paymentRecord?.patient_amount || 0).toFixed(2)}
 </span>
 </div>
 
 {/* Tiny Breakdown */}
 <div className="space-y-2 border-t border-gray-200 pt-4">
 <div className="flex flex-col text-[13px]">
 <span className="text-gray-500 font-medium">{t('paymentId')}</span>
 <span className="font-bold text-near-black">{paymentRecord?.id || 'PAY-XXXX-XXXX'}</span>
 </div>
 <div className="flex flex-col text-[13px]">
 <span className="text-gray-500 font-medium">{t('date')}</span>
 <span className="font-bold text-near-black">{paymentRecord?.paid_at ? new Date(paymentRecord.paid_at).toLocaleString() : new Date().toLocaleString()}</span>
 </div>
 <div className="flex flex-col text-[13px]">
 <span className="text-gray-500 font-medium">{t('caseRef')}</span>
 <span className="font-bold text-near-black">{recommendationId}</span>
 </div>
 </div>
 </div>

 <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border-[1.5px] border-primary text-primary hover:bg-primary hover:text-white rounded-full font-semibold transition-colors">
 <Download className="w-4 h-4" /> {t('btnDownload')}
 </button>
 <p className="text-[12px] text-gray-500 mt-3">{t('emailCopy')}</p>
 </div>

 <div className="text-center">
 <Link href={`/patient/${recommendationId}`} className="text-[14px] font-bold text-gray-500 hover:text-near-black transition-colors flex items-center justify-center gap-1.5">
 <User className="w-4 h-4" /> {t('btnBack')}
 </Link>
 </div>
 </div>
 </div>
 );
}
