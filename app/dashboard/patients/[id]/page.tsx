"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, User, Phone, Mail, MapPin, ShieldCheck, HeartPulse, FileText, AlertTriangle } from "lucide-react";
import { PatientModal } from "@/components/dashboard/PatientModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from '@/lib/format-date';

export default function PatientDetailPage() {
 const router = useRouter();
 const { id } = useParams() as { id: string };
 
 const [patient, setPatient] = useState<any>(null);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [isDeleting, setIsDeleting] = useState(false);

 const loadPatient = async () => {
 setLoading(true);
 try {
 const res = await fetch(`/api/doctor/patients/${id}`);
 if (!res.ok) throw new Error("Failed to load patient");
 const { patient: p } = await res.json();
 setPatient(p);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 if (id) loadPatient();
 }, [id]);

 if (loading) {
 return (
 <div className="flex items-center justify-center p-20 min-h-screen">
 <LoadingSpinner size="lg" />
 </div>
 );
 }

 if (error || !patient) {
 return (
 <div className="p-8 max-w-xl">
 <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mb-4">
 {error || "Patient not found."}
 </div>
 <button onClick={() => router.push("/dashboard/patients")} className="text-primary-dark font-medium text-sm flex items-center gap-1">
 <ArrowLeft className="w-4 h-4" /> Back to Patients
 </button>
 </div>
 );
 }

 const recommendations = Array.isArray(patient.recommendations) ? patient.recommendations : [];

 const formatInsurance = (val: string) => {
 const map: Record<string, string> = {
 'gesetzlich': 'Gesetzlich versichert',
 'privat_versichert': 'Privat versichert (PKV)',
 'selbstzahler': 'Selbstzahler / IGeL'
 };
 return map[val] || val || "Unknown";
 };

 const handleDelete = async () => {
 if (recommendations.length > 0) return;
 if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) return;
 setIsDeleting(true);
 try {
 const res = await fetch(`/api/doctor/patients/${id}`, { method: 'DELETE' });
 if (!res.ok) {
 const data = await res.json();
 throw new Error(data.error || "Failed to delete patient");
 }
 router.push("/dashboard/patients");
 } catch (err: any) {
 alert(err.message);
 setIsDeleting(false);
 }
 };

 return (
 <div className="flex-1 min-w-0 w-full animate-in fade-in duration-300 pb-12">
 <Link 
 href="/dashboard/patients" 
 className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-primary-dark transition-colors mb-4"
 >
 <ArrowLeft className="w-4 h-4" /> Back to Patients
 </Link>

 <div className="mb-6 border-b border-gray-100 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <h1 className="font-heading text-[24px] sm:text-[32px] font-medium text-near-black tracking-tight m-0">
 {patient.last_name}, {patient.first_name}
 </h1>
 <div className="flex items-center gap-3">
 <button 
 onClick={handleDelete}
 disabled={isDeleting || recommendations.length > 0}
 title={recommendations.length > 0 ? "Cannot delete patient with existing recommendations" : "Delete patient"}
 className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-transparent hover:bg-red-50 text-[13px] font-semibold text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isDeleting ? "Deleting..." : "Delete Patient"}
 </button>
 <button 
 onClick={() => setIsModalOpen(true)}
 className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[13px] font-semibold text-near-black transition-colors"
 >
 <Edit2 className="w-4 h-4 text-gray-400" />
 Edit Patient
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 
 {/* Left Column: Patient Profile Card */}
 <div className="lg:col-span-5 lg:col-start-1 h-min space-y-4">
 
 {patient.is_minor && (
 <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-[16px] flex items-start gap-3 shadow-sm">
 <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
 <AlertTriangle className="w-4 h-4 text-orange-600" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="text-[13px] font-semibold text-orange-900">This patient is a minor (under 18).</div>
 <div className="text-[13px] text-orange-700 mt-0.5">
 Guardian: {patient.guardian_salutation} {patient.guardian_first_name} {patient.guardian_last_name}
 </div>
 </div>
 </div>
 )}

 <div className="bg-white rounded-[20px] border border-gray-200 overflow-hidden shadow-sm">
 <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
 <h2 className="font-semibold text-[15px] text-near-black tracking-tight m-0">
 Profile Details
 </h2>
 </div>
 
 <div className="p-6">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
 
 {/* Left Mini-col */}
 <div className="space-y-5">
 <div className="flex gap-3">
 <User className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
 <div>
 <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Date of Birth</div>
 <div className="text-[14px] font-medium text-near-black">{formatDate(patient.date_of_birth)}</div>
 </div>
 </div>

 <div className="flex gap-3">
 <div className="w-5 h-5 shrink-0" />
 <div>
 <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Gender</div>
 <div className="text-[14px] font-medium text-near-black">
 {patient.gender === 'M' ? 'Männlich' : patient.gender === 'W' ? 'Weiblich' : 'Divers'}
 </div>
 </div>
 </div>

 <div className="flex gap-3">
 <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
 <div>
 <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Insurance</div>
 <div className="text-[14px] font-medium text-near-black">{formatInsurance(patient.insured_status)}</div>
 </div>
 </div>

 <div className="flex gap-3">
 <HeartPulse className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
 <div>
 <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Family Doctor</div>
 <div className="text-[14px] font-medium text-near-black">{patient.family_doctor || "Not specified"}</div>
 </div>
 </div>
 </div>

 {/* Right Mini-col */}
 <div className="space-y-5">
 <div className="flex gap-3">
 <Mail className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
 <div className="min-w-0">
 <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Email</div>
 <div className="text-[14px] font-medium text-near-black truncate">{patient.email || "No email on file"}</div>
 </div>
 </div>

 <div className="flex gap-3">
 <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
 <div>
 <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Phone</div>
 <div className="text-[14px] font-medium text-near-black">{patient.phone || "No phone on file"}</div>
 </div>
 </div>

 <div className="flex gap-3">
 <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
 <div>
 <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Address</div>
 {patient.address_line1 || patient.address_city ? (
 <div className="text-[14px] font-medium text-near-black leading-snug">
 {patient.address_line1}<br />
 {patient.address_line2 && <>{patient.address_line2}<br /></>}
 {patient.address_zip} {patient.address_city}<br />
 {patient.address_country}
 </div>
 ) : (
 <div className="text-[14px] font-medium text-gray-500">No address on file</div>
 )}
 </div>
 </div>
 </div>

 </div>

 {patient.observations && (
 <>
 <div className="h-px w-full bg-gray-100 my-6" />
 <div>
 <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-1.5">Doctor Observations</div>
 <div className="text-[13px] text-gray-600 bg-amber-50/50 border border-amber-100 rounded-xl p-4 leading-relaxed">
 {patient.observations}
 </div>
 </div>
 </>
 )}
 </div>
 </div>
 </div>

 {/* Right Column: Recommendation History */}
 <div className="lg:col-span-7">
 <div className="bg-white rounded-[20px] border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
 <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
 <h2 className="font-semibold text-[15px] text-near-black tracking-tight m-0">
 Recommendation History
 </h2>
 <Link 
 href={`/dashboard/recommendations/new?patient_id=${patient.id}`}
 className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white rounded-full px-4 py-2 text-[12px] font-semibold transition-colors"
 >
 Create Recommendation
 </Link>
 </div>

 <div className="flex-1">
 {recommendations.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full border-collapse text-left">
 <thead>
 <tr className="border-b border-gray-100">
 <th className="px-6 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest">ID</th>
 <th className="px-6 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Status</th>
 <th className="px-6 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Tests</th>
 <th className="px-6 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Total</th>
 <th className="px-6 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Date</th>
 </tr>
 </thead>
 <tbody>
 {recommendations.map((rec: any, i: number) => {
 const items = Array.isArray(rec.items) ? rec.items : [];
 const total = items.reduce((acc: number, curr: any) => acc + (parseFloat(curr.unit_price || 0) * (curr.quantity || 1)), 0);

 return (
 <tr 
 key={rec.id} 
 onClick={() => router.push(`/dashboard/recommendations/${rec.id}`)}
 className={`group cursor-pointer hover:bg-gray-50/50 transition-colors ${i < recommendations.length - 1 ? 'border-b border-gray-100' : ''}`}
 >
 <td className="px-6 py-4 font-mono text-[13px] text-gray-600 font-medium">
 {rec.display_id || rec.id.substring(0,8)}
 </td>
 <td className="px-6 py-4">
 <StatusBadge status={rec.status} />
 </td>
 <td className="px-6 py-4 font-body text-[13px] font-medium text-gray-600">
 {items.length}
 </td>
 <td className="px-6 py-4 font-body text-[13px] font-medium text-gray-600">
 €{total.toFixed(2)}
 </td>
 <td className="px-6 py-4 font-body text-[13px] text-gray-500">
 {formatDate(rec.created_at)}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="h-full flex items-center justify-center p-12 text-center text-[14px] text-gray-500 flex-col gap-2 pt-24">
 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-1">
 <FileText className="w-5 h-5 text-gray-300" />
 </div>
 No recommendations for this patient yet.
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 <PatientModal 
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 patient={patient}
 onSuccess={() => {
 setIsModalOpen(false);
 loadPatient();
 }}
 />
 </div>
 );
}
