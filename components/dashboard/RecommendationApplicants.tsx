"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserCheck, AlertCircle, Loader2, XCircle, Star, Briefcase, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function CaseApplicants({ recommendationId, selectionMode = "clinic_shortlist" }: { recommendationId: string, selectionMode?: string }) {
 const [applications, setApplications] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [selectedApp, setSelectedApp] = useState<any>(null);
 const [updating, setUpdating] = useState(false);
 const t = useTranslations('hc.applicants');

 useEffect(() => {
 async function fetchApplicants() {
 try {
 const res = await fetch(`/api/doctor/recommendations/${recommendationId}/applications`);
 if (!res.ok) throw new Error("Failed to fetch applicants");
 const data = await res.json();
 setApplications(data.applications || []);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 }
 fetchApplicants();
 }, [recommendationId]);

 const handleStatusChange = async (appId: string, newStatus: string) => {
 setUpdating(true);
 try {
 const res = await fetch(`/api/doctor/applications/${appId}/status`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: newStatus })
 });
 if (!res.ok) {
 const err = await res.json();
 throw new Error(err.error || 'Failed to update status');
 }
 setApplications(applications.map(app => app.id === appId ? { ...app, status: newStatus } : app));
 setSelectedApp(null);
 } catch (err: any) {
 alert(err.message);
 } finally {
 setUpdating(false);
 }
 };

 return (
 <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm">
 <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
 <h3 className="font-heading text-[15px] font-medium text-near-black flex items-center gap-2">
 <UserCheck className="w-[18px] h-[18px] text-primary-dark" />
 {t('title')}
 </h3>
 <span className="text-[12px] font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700">
 {t('count', { count: applications.length })}
 </span>
 </div>
 
 {loading ? (
 <div className="flex justify-center p-8">
 <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
 </div>
 ) : error ? (
 <div className="p-4 bg-red-50 text-red-600 text-[13px] rounded-lg border border-red-100">{error}</div>
 ) : applications.length > 0 ? (
 <div className="space-y-3">
 {applications.map((app: any) => {
 const bc = app.blood_collector;
 if (!bc) return null;
 return (
 <div key={app.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col gap-3">
 <div className="flex justify-between items-start">
 <div>
 <div className="font-semibold text-[15px] text-near-black flex items-center gap-2">
 {bc.first_name} {bc.last_name}
 {app.status === 'accepted' && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t('shortlisted')}</span>}
 {app.status === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t('rejected')}</span>}
 {app.status === 'withdrawn' && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t('withdrawn')}</span>}
 </div>
 <div className="text-[12px] text-gray-500 font-medium mt-0.5">
 {bc.qualification || "Professional"} • {t('collections', { count: bc.total_collections || 0 })}
 </div>
 </div>
 <button 
 onClick={() => setSelectedApp(app)}
 className="text-[13px] bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black font-semibold px-4 py-2 rounded-full transition-colors"
 >
 {t('reviewBid')}
 </button>
 </div>
 
 <div className="grid grid-cols-2 gap-2 text-[12px] mt-1">
 <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 flex flex-col shadow-sm">
 <span className="text-gray-500 mb-0.5">{t('practiceFee')}</span>
 <span className="font-bold text-[14px] text-near-black">€{bc.practice_fee || 0}</span>
 </div>
 <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 flex flex-col shadow-sm">
 <span className="text-gray-500 mb-0.5">{t('homeVisitFee')}</span>
 <span className="font-bold text-[14px] text-near-black">€{bc.home_visit_fee || 0}</span>
 </div>
 </div>

 {app.bc_message && (
 <div className="mt-1 bg-white p-3 rounded-lg border border-gray-200 text-[13px] text-gray-500 italic relative">
 <span className="absolute top-2 left-2 text-gray-300 font-serif text-lg leading-none">"</span>
 <span className="pl-4 block">{app.bc_message}</span>
 </div>
 )}
 </div>
 );
 })}
 </div>
 ) : (
 <div className="p-8 text-center text-[13px] text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
 <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
 {t('noApplicants')}
 </div>
 )}

 {/* Review Modal */}
 {selectedApp && (
 <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 py-10 overflow-y-auto">
 <div className="bg-white w-full max-w-[600px] rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
 <button 
 onClick={() => setSelectedApp(null)}
 className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-[110]"
 >
 <XCircle className="w-5 h-5 text-gray-500" />
 </button>
 
 <div className="p-6 border-b border-gray-200 shrink-0">
 <div className="flex gap-2 items-center mb-3">
 <span className="bg-primary-light text-primary-dark px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
 {t('reviewBid')}
 </span>
 {selectedApp.status === 'accepted' && (
 <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase">{t('shortlisted')}</span>
 )}
 {selectedApp.status === 'rejected' && (
 <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase">{t('rejected')}</span>
 )}
 {selectedApp.status === 'withdrawn' && (
 <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase">{t('withdrawn')}</span>
 )}
 </div>
 <h2 className="font-heading font-medium text-[22px] text-near-black">
 {selectedApp.blood_collector.first_name} {selectedApp.blood_collector.last_name}
 </h2>
 <div className="text-[14px] text-gray-500 mt-1 flex items-center gap-2">
 <Briefcase className="w-4 h-4" /> {selectedApp.blood_collector.qualification || "Professional"}
 <span className="text-gray-300">|</span>
 <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {selectedApp.blood_collector.rating || "5.0"}
 <span className="text-gray-300">|</span>
 {t('collections', { count: selectedApp.blood_collector.total_collections || 0 })}
 </div>
 </div>

 <div className="p-6 overflow-y-auto flex-1 space-y-6">
 
 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
 <div className="text-[12px] font-medium text-gray-500 mb-1">{t('practiceFee')}</div>
 <div className="font-heading font-medium text-[20px] text-near-black">€{selectedApp.blood_collector.practice_fee || 0}</div>
 </div>
 <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
 <div className="text-[12px] font-medium text-gray-500 mb-1">{t('homeVisitFee')}</div>
 <div className="font-heading font-medium text-[20px] text-near-black">€{selectedApp.blood_collector.home_visit_fee || 0}</div>
 </div>
 </div>

 <div>
 <h3 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">{t('specialExperience')}</h3>
 <div className="flex flex-wrap gap-2">
 {selectedApp.blood_collector.special_experience && Object.entries(selectedApp.blood_collector.special_experience).filter(([k,v]) => v).map(([k]) => (
 <span key={k} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[13px] font-medium capitalize border border-blue-100">
 {k.replace('_', ' ')}
 </span>
 ))}
 {(!selectedApp.blood_collector.special_experience || !Object.entries(selectedApp.blood_collector.special_experience).some(([k,v]) => v)) && (
 <span className="text-[13px] text-gray-500 italic">{t('noneListed')}</span>
 )}
 </div>
 </div>

 <div>
 <h3 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">{t('equipment')}</h3>
 <div className="flex flex-wrap gap-2">
 {(() => {
 const eq = selectedApp.blood_collector.equipment;
 if (!eq) return <span className="text-[13px] text-gray-500 italic">{t('noEquipment')}</span>;
 
 const labels: Record<string, string> = {
 centrifuge: t('mobileCentrifuge'),
 freezer: t('sampleFreezer'),
 cooling_box: t('coolingBox')
 };
 
 let activeKeys: string[] = [];
 if (Array.isArray(eq)) {
 activeKeys = eq;
 } else if (typeof eq === 'object') {
 activeKeys = Object.entries(eq).filter(([_, v]) => v).map(([k]) => k);
 }

 if (activeKeys.length === 0) {
 return <span className="text-[13px] text-gray-500 italic">{t('noEquipment')}</span>;
 }

 return activeKeys.map((k) => (
 <span key={k} className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[13px] font-medium border border-amber-100">
 {labels[k] || k.replace('_', ' ')}
 </span>
 ));
 })()}
 </div>
 </div>

 {selectedApp.blood_collector.bio && (
 <div>
 <h3 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-2">{t('bio')}</h3>
 <div className="text-[14px] text-gray-500 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">
 {selectedApp.blood_collector.bio}
 </div>
 </div>
 )}

 {selectedApp.bc_message && (
 <div>
 <h3 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-2">{t('appMessage')}</h3>
 <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-[14px] text-gray-500 italic relative">
 <span className="absolute top-2 left-2 text-blue-200 font-serif text-3xl leading-none">"</span>
 <div className="pl-6 relative z-10">{selectedApp.bc_message}</div>
 </div>
 </div>
 )}
 </div>

 <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between gap-3 shrink-0 items-center">
 <span className="text-[12px] text-gray-500">{t('status')} <strong className="uppercase">{selectedApp.status}</strong></span>
 {selectedApp.status === 'applied' && selectionMode !== 'patient_decides' ? (
 <div className="flex gap-2">
 {selectionMode === 'clinic_shortlist' ? (
 <>
 <button 
 onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
 disabled={updating}
 className="px-5 py-2.5 rounded-full font-semibold text-[13px] text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
 >
 {t('reject')}
 </button>
 <button 
 onClick={() => handleStatusChange(selectedApp.id, 'accepted')}
 disabled={updating}
 className="px-6 py-2.5 rounded-full font-semibold text-[13px] text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
 >
 <CheckCircle2 className="w-4 h-4" /> {t('approveShortlist')}
 </button>
 </>
 ) : selectionMode === 'clinic_approval' ? (
 <button 
 onClick={() => handleStatusChange(selectedApp.id, 'accepted')}
 disabled={updating}
 className="px-6 py-2.5 rounded-full font-semibold text-[13px] text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
 >
 <UserCheck className="w-4 h-4" /> {t('assignCollector')}
 </button>
 ) : null}
 </div>
 ) : (
 <button 
 onClick={() => setSelectedApp(null)}
 className="px-6 py-2.5 rounded-full font-semibold text-[13px] bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black transition-colors"
 >
 {t('close')}
 </button>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
