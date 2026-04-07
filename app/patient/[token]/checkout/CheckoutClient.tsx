"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export default function CheckoutClient({ recommendationId, appointmentId, amount, pricingBreakdown }: any) {
 const router = useRouter();
 const t = useTranslations('patient.checkout');
 const [paying, setPaying] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const handlePay = async () => {
 setPaying(true);
 setError(null);

 try {
 const res = await fetch(`/api/payments/checkout`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 recommendationId,
 appointmentId,
 pricingBreakdown
 })
 });

 if (!res.ok) {
 const d = await res.json();
 throw new Error(d.error || t('paymentFailed'));
 }

 const data = await res.json();
 
 // After successful payment, create portal session and redirect
 const sessionRes = await fetch('/api/portal/auth/create-from-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ patient_token: recommendationId }),
 });

 if (sessionRes.ok) {
  // Cookie is set by the API, redirect to portal
  window.location.href = '/portal';
 } else {
  // Fallback: show confirmation page as before
  router.push(`/patient/${recommendationId}/receipt`);
 }

 } catch (e: any) {
 setError(e.message);
 setPaying(false);
 }
 };

 return (
 <div>
 {error && <div className="mb-4 text-red-600 font-bold text-[14px] text-center">{error}</div>}
 <Button 
 onClick={handlePay} 
 disabled={paying}
 className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white text-[16px] py-6 rounded-full font-semibold shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] transition-colors"
 >
 {paying ? t('btnProcessing') : t('btnConfirm', { amount: amount.toFixed(2) })}
 </Button>
 </div>
 );
}
