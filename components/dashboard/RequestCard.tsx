"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, CalendarDays, AlertTriangle, Check, X, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDate } from '@/lib/format-date';

export function RequestCard({ appointment }: { appointment: any }) {
 const [status, setStatus] = useState<"pending" | "accepted" | "declined" | "counter_proposed">("pending");
 const [isCountering, setIsCountering] = useState(false);
 const [loading, setLoading] = useState(false);
 const t = useTranslations('hc.requestCard');

 const handleAction = async (action: "accept" | "decline" | "counter") => {
 setLoading(true);
 // In a real app we'd call an API here to update the appointment status
 // For now we just mock the UI state change
 setTimeout(() => {
 if (action === "accept") setStatus("accepted");
 if (action === "decline") setStatus("declined");
 if (action === "counter") setStatus("counter_proposed");
 setLoading(false);
 setIsCountering(false);
 }, 800);
 };

 if (status !== "pending") {
 return (
 <Card className="opacity-60 bg-gray-50 border-dashed">
 <div className="flex items-center gap-3">
 {status === "accepted" && <Check className="w-5 h-5 text-emerald-600" />}
 {status === "declined" && <X className="w-5 h-5 text-red-600" />}
 {status === "counter_proposed" && <Clock className="w-5 h-5 text-amber-600" />}
 <div className="font-semibold text-near-black">
 {t(status, { fallback: `Request ${status.replace('_', ' ')}` })}
 </div>
 </div>
 </Card>
 );
 }

 const { case: recommendationData, patient } = appointment;

 return (
 <Card className="bg-white hover:shadow-md transition-shadow">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h3 className="font-heading text-lg font-medium text-near-black mb-1">
 {patient.first_name} {patient.last_name}
 </h3>
 <div className="flex gap-2">
 <Badge variant={recommendationData.urgency_level === 'urgent' ? 'urgent' : 'default'}>
 {recommendationData.urgency_level === 'urgent' ? t('urgent') : t('routine')}
 </Badge>
 <Badge variant="pending">{recommendationData.mobility === 'home_visit' ? t('homeVisit') : t('inPractice')}</Badge>
 </div>
 </div>
 <div className="text-right">
 <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('proposedTime')}</div>
 <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
 <CalendarDays className="w-4 h-4" />
 <span className="font-bold text-[14px]">
 {formatDate(appointment.scheduled_at, { includeTime: true })}
 </span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-gray-50 rounded-[12px] border border-gray-200">
 <div>
 <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('patientDetails')}</div>
 <div className="text-[13px] text-near-black flex items-start gap-1.5 mb-2">
 <MapPin className="w-[14px] h-[14px] text-gray-500 shrink-0 mt-0.5" />
 <span>{patient.address?.street}, {patient.address?.zip} {patient.address?.city}</span>
 </div>
 </div>
 <div>
 <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('testReqs')}</div>
 <div className="text-[13px] text-near-black font-medium">
 {Array.isArray(recommendationData.test_types) ? recommendationData.test_types.join(', ') : t('standardDraw')}
 </div>
 <div className="text-[12px] text-gray-500 mt-1">{t('requestedBy', { name: recommendationData.doctor_practice?.name })}</div>
 </div>
 </div>

 {appointment.notes && (
 <div className="mb-6 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-2">
 <div className="shrink-0 mt-0.5"><AlertTriangle className="w-[14px] h-[14px] text-blue-600" /></div>
 <div className="text-[13px] text-blue-900 leading-snug"><span className="font-bold block mb-0.5">{t('noteFromPatient')}</span> "{appointment.notes}"</div>
 </div>
 )}

 {isCountering ? (
 <div className="pt-4 border-t border-gray-200">
 <div className="text-[13px] font-bold text-near-black mb-3">{t('proposeAltTime')}</div>
 <div className="flex gap-3 mb-4">
 <input type="date" className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-[13px]" />
 <input type="time" className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-[13px]" />
 </div>
 <div className="flex gap-2 justify-end">
 <Button variant="ghost" className="h-9 px-4 text-[13px]" onClick={() => setIsCountering(false)}>{t('cancel')}</Button>
 <Button 
 variant="secondary" 
 className="h-9 px-4 text-[13px] border-amber-500/30 text-amber-700 bg-amber-50"
 onClick={() => handleAction("counter")}
 disabled={loading}
 >
 {loading ? t('sending') : t('sendProposal')}
 </Button>
 </div>
 </div>
 ) : (
 <div className="pt-4 border-t border-gray-200 flex gap-2 justify-end">
 <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleAction("decline")} disabled={loading}>
 {t('decline')}
 </Button>
 <Button variant="secondary" onClick={() => setIsCountering(true)} disabled={loading}>
 {t('proposeNewTime')}
 </Button>
 <Button variant="primary" onClick={() => handleAction("accept")} disabled={loading}>
 {loading ? t('accepting') : t('acceptRequest')}
 </Button>
 </div>
 )}
 </Card>
 );
}
