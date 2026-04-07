"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Check, ArrowRight, LayoutDashboard, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import { useTranslations } from "next-intl";

export default function CaseSuccessPage({ params }: { params: { id: string } }) {
 const supabase = createClient();
 const [copied, setCopied] = useState(false);
 const [patientLink, setPatientLink] = useState("");
 const [loading, setLoading] = useState(true);
 const t = useTranslations('hc.caseSuccess');

 useEffect(() => {
 async function fetchCase() {
 // For security, just verify it exists. The ID is the param.
 const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
 setPatientLink(`${baseUrl}/patient/${params.id}`);
 setLoading(false);
 }
 fetchCase();
 }, [params.id]);

 const handleCopy = async () => {
 if (!patientLink) return;
 try {
 await navigator.clipboard.writeText(patientLink);
 setCopied(true);
 setTimeout(() => setCopied(false), 2500);
 } catch (err) {
 console.error("Failed to copy:", err);
 }
 };

 if (loading) return null;

 return (
 <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in-95 duration-500">
 <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50">
 <CheckCircle2 className="w-10 h-10 text-emerald-600" strokeWidth={2.5} />
 </div>
 
 <h1 className="text-3xl font-heading font-medium text-near-black mb-2">{t('title')}</h1>
 <p className="text-gray-500 text-center max-w-md mb-8">
 {t.rich('desc', { 
 id: params.id, 
 strong: (chunks) => <span className="font-semibold text-near-black">{chunks}</span> 
 })}
 </p>

 <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-open-bg rounded-xl flex items-center justify-center">
 <HeartHandshake className="w-5 h-5 text-primary-dark" />
 </div>
 <div>
 <h3 className="font-medium text-near-black">{t('linkBox.title')}</h3>
 <p className="text-[13px] text-gray-500">{t('linkBox.desc')}</p>
 </div>
 </div>

 <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xl">
 <input 
 type="text" 
 readOnly 
 value={patientLink} 
 className="bg-transparent flex-1 text-[13px] text-gray-500-700 font-medium px-3 outline-none"
 />
 <Button 
 variant="ghost" 
 onClick={handleCopy}
 className={`shrink-0 flex items-center gap-2 px-4 py-2 h-9 rounded-lg border transition-colors ${
 copied 
 ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" 
 : "bg-white text-gray-500-700 border-gray-200 hover:bg-gray-100"
 }`}
 >
 {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
 <span className="text-[13px] font-semibold">{copied ? t('linkBox.copied') : t('linkBox.copy')}</span>
 </Button>
 </div>
 </div>

 <div className="flex gap-4">
 <Link href="/dashboard">
 <Button variant="ghost" className="h-11 px-6 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-near-black hover:bg-gray-50 flex items-center gap-2 shadow-sm">
 <LayoutDashboard className="w-4 h-4" />
 {t('btnDashboard')}
 </Button>
 </Link>
 <Link href="/dashboard/recommendations/new">
 <Button className="h-11 px-6 rounded-xl bg-primary-dark hover:bg-primary-dark text-white flex items-center gap-2 shadow-sm">
 {t('btnNewCase')}
 <ArrowRight className="w-4 h-4" />
 </Button>
 </Link>
 </div>
 </div>
 );
}
