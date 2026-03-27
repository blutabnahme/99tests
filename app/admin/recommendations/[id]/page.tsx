"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, FileText, User, Building, Clock, 
  CreditCard, ShieldAlert, CheckCircle, RefreshCw, XCircle, AlertTriangle
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useTranslations } from "next-intl";

export default function AdminCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recommendationId = params.id as string;
  const t = useTranslations();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Editable Form states
  const [status, setStatus] = useState("");
  const [urgency, setUrgency] = useState("");
  const [mode, setMode] = useState("");
  const [hcId, setHcId] = useState("");
  const [notes, setNotes] = useState("");

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingHC, setSavingHC] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // BC Assignment States
  const [selectedBcId, setSelectedBcId] = useState("");
  const [bcActionLoading, setBcActionLoading] = useState(false);
  const [bcSearch, setBcSearch] = useState("");
  const [showBcDropdown, setShowBcDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, [recommendationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/recommendations/${recommendationId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        
        // Populate local state
        if (json.recommendationData) {
          setStatus(json.recommendationData.status);
          setUrgency(json.recommendationData.urgency_level);
          setMode(json.recommendationData.bc_selection_mode);
          setHcId(json.recommendationData.doctor_id);
          setNotes(json.recommendationData.admin_notes || "");
        }
      } else if (res.status === 404) {
        router.push('/admin/recommendations');
      }
    } catch (err) {
      console.error("Fetch case error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatch = async (payload: any, loadSetter: (l: boolean) => void) => {
    try {
      loadSetter(true);
      const res = await fetch(`/api/admin/recommendations/${recommendationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Patch error:", err);
    } finally {
      loadSetter(false);
    }
  };

  const handleBcAction = async (payload: any) => {
    try {
      setBcActionLoading(true);
      const res = await fetch(`/api/admin/recommendations/${recommendationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData();
        if (payload.action === 'assign_bc') {
          setSelectedBcId("");
          setBcSearch("");
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to process BC assignment");
      }
    } catch (err) {
      console.error("BC action error:", err);
    } finally {
      setBcActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading Recommendation Data...</p>
      </div>
    );
  }

  if (!data?.recommendationData) return null;

  const { recommendationData, applications, proposedSlots, appointment, payment, allHCs, allActiveBCs } = data;
  const p = recommendationData.patient;

  const availableBCs = allActiveBCs?.filter((bc: any) => !applications.some((a: any) => a.bc_id === bc.id && a.status !== 'rejected' && a.status !== 'withdrawn')) || [];
  const filteredBCs = availableBCs.filter((bc: any) => {
    const searchLow = bcSearch.toLowerCase();
    const name = ((bc.first_name || '') + ' ' + (bc.last_name || '')).toLowerCase();
    return (
      name.includes(searchLow) ||
      (bc.contact_email || '').toLowerCase().includes(searchLow)
    );
  });

  // Timeline Compiler
  const timeline: { date: Date, title: string, desc: string, color: string }[] = [];
  
  timeline.push({
    date: new Date(recommendationData.created_at),
    title: "Recommendation Created",
    desc: "Originating status established.",
    color: "bg-red-500"
  });

  applications.forEach((a: any) => {
    timeline.push({
      date: new Date(a.applied_at),
      title: "BC Applied",
      desc: `${a.bc?.first_name} ${a.bc?.last_name} applied.`,
      color: "bg-blue-500"
    });
  });

  if (appointment) {
    timeline.push({
      date: new Date(appointment.created_at),
      title: "Appointment Booked",
      desc: `Scheduled for ${new Date(appointment.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date(appointment.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
      color: "bg-teal-500"
    });
  }

  if (payment && payment.paid_at) {
    timeline.push({
      date: new Date(payment.paid_at),
      title: "Payment Completed",
      desc: `Paid €${Number(payment.patient_amount).toFixed(2)}`,
      color: "bg-teal-500"
    });
  }

  const sortedTimeline = timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="flex-1 min-w-0 w-full font-body">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link href="/admin/recommendations" className="flex items-center gap-2 text-gray-500 hover:text-near-black text-[13px] font-medium mb-3 transition-colors inline-block w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Recommendations
          </Link>
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight">{recommendationData.id}</h1>
            <StatusBadge status={recommendationData.status} />
          </div>
          <div className="text-[14px] sm:text-[15px] text-gray-500 font-medium tracking-tight">
            {p?.first_name} {p?.last_name} <span className="text-gray-300 mx-1">·</span> {recommendationData.hc?.name || 'Unknown Healthcare Company'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recommendation Config Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlert className="w-5 h-5 text-gray-400" />
            <h2 className="text-[15px] font-semibold text-near-black">Recommendation Configuration</h2>
          </div>
          <div className="space-y-4 text-[13px]">
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Status Override</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white"
              >
                <option value="created">Created</option>
                <option value="pending">Pending</option>
                <option value="matched">Matched</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Urgency Level</label>
              <select 
                value={urgency} 
                onChange={e => setUrgency(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Selection Mode</label>
              <select 
                value={mode} 
                onChange={e => setMode(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white"
              >
                <option value="patient_decides">Patient Decides</option>
                <option value="clinic_shortlist">Clinic Shortlist</option>
                <option value="clinic_approval">Clinic Approval</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Admin Internal Notes</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-200 bg-white min-h-[80px]"
                placeholder="Private notes (internal only)..."
              />
            </div>
            <button 
              onClick={() => handlePatch({ status, urgency_level: urgency, bc_selection_mode: mode, admin_notes: notes }, setSavingSettings)}
              disabled={savingSettings}
              className="bg-primary text-white w-full sm:w-auto px-5 rounded-full h-9 font-semibold hover:bg-primary-dark transition-all shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px] flex items-center justify-center disabled:opacity-50"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-gray-400" />
            <h2 className="text-[15px] font-semibold text-near-black">Patient Record</h2>
          </div>
          {p ? (
            <div className="space-y-4 text-[13px]">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-near-black">{p.first_name} {p.last_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold text-near-black">{p.email ? p.email : <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold text-near-black">{p.phone ? p.phone : <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">DOB</span>
                <span className="font-semibold text-near-black">{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}</span>
              </div>
              <div className="pt-2">
                <Link href={`/patient/${recommendationId}`} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline text-[12px] flex items-center gap-1">
                  View Patient Portal Link
                </Link>
              </div>
            </div>
          ) : (
             <div className="text-[13px] text-gray-500 italic">No patient attached.</div>
          )}
        </div>

        {/* Doctor Reassignment */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building className="w-5 h-5 text-gray-400" />
            <h2 className="text-[15px] font-semibold text-near-black">Healthcare Company Reassignment</h2>
          </div>
          <div className="space-y-4 text-[13px]">
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Assigning Doctor to:</label>
              <select 
                value={hcId} 
                onChange={e => setHcId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white mb-2"
              >
                {allHCs.map((hc: any) => (
                   <option key={hc.id} value={hc.id}>{hc.name}</option>
                ))}
              </select>
              <div className="text-[12px] text-gray-400 leading-snug">
                Reassigning will notify both the current and new Healthcare Company.
              </div>
            </div>
            <button 
              onClick={() => handlePatch({ doctor_id: hcId }, setSavingHC)}
              disabled={savingHC || hcId === recommendationData.doctor_id}
              className="bg-[#1A1D23] text-white w-full sm:w-auto px-5 rounded-full h-9 font-semibold hover:bg-black transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {savingHC ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Reassign Network Doctor"}
            </button>
          </div>
        </div>

        {/* Payment & Appointments */}
        <div className="flex flex-col gap-6">
          {appointment && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h2 className="text-[15px] font-semibold text-near-black">Confirmed Appointment</h2>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Date</span>
                  <span className="font-semibold text-near-black text-[14px]">
                    {new Date(appointment.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(appointment.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Assigned BC</span>
                  <span className="font-semibold text-near-black text-[14px]">
                    {appointment.bc?.first_name} {appointment.bc?.last_name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {payment && (
             <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
               <div className="flex items-center gap-2 mb-5">
                 <CreditCard className="w-5 h-5 text-gray-400" />
                 <h2 className="text-[15px] font-semibold text-near-black">Financial Transfer</h2>
               </div>
               <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500">Patient Paid</span>
                    <span className="font-bold text-near-black">€{Number(payment.patient_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500">BC Payout</span>
                    <span className="font-semibold text-gray-700">€{Number(payment.bc_payout || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500">Platform Commission</span>
                    <span className="font-semibold text-gray-700">€{Number(payment.platform_commission || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500">VAT (19%)</span>
                    <span className="font-semibold text-gray-700">€{Number(payment.vat_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-500">Paid At</span>
                    <span className="text-gray-700">{payment.paid_at ? new Date(payment.paid_at).toLocaleString() : <span className="text-gray-400 italic">Unpaid</span>}</span>
                  </div>
               </div>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         {/* Applications Stack */}
         <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold text-near-black mb-4">Network Applications ({applications.length})</h2>
            <div className="space-y-3">
              {applications.length === 0 ? (
                <div className="text-[13px] text-gray-400 italic bg-gray-50 p-4 rounded-lg text-center border border-dashed border-gray-200">
                  No Blood Collector matching attempts yet.
                </div>
              ) : (
                applications.map((app: any) => (
                  <div key={app.id} className="p-4 border border-gray-100 rounded-lg shadow-sm bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-[13px] text-near-black mb-1.5">{app.bc?.first_name} {app.bc?.last_name}</div>
                      <div className="text-[12px] text-gray-500 mb-2">
                        Applied: {new Date(app.applied_at).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[12px] text-gray-500 font-medium">Status Override:</span>
                         <select 
                           value={app.status}
                           onChange={(e) => {
                             if(window.confirm(`Change application status to ${e.target.value}?`)) {
                               handleBcAction({ action: 'update_application_status', application_id: app.id, status: e.target.value });
                             }
                           }}
                           disabled={bcActionLoading}
                           className="text-[12px] h-7 px-2 border border-gray-200 rounded bg-white shadow-sm disabled:opacity-50"
                         >
                           <option value="applied">Applied</option>
                           <option value="accepted">Accepted</option>
                           <option value="rejected">Rejected</option>
                           <option value="withdrawn">Withdrawn</option>
                         </select>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <StatusBadge status={app.status} />
                      {(app.status === 'accepted' || app.status === 'matched') && (
                        <button 
                          onClick={() => {
                            if(window.confirm("Are you sure you want to remove this BC's assignment? This will release their slots and notify them immediately.")) {
                               handleBcAction({ action: 'remove_bc', application_id: app.id });
                            }
                          }}
                          disabled={bcActionLoading}
                          className="mt-1 text-[11px] font-semibold text-red-600 hover:text-red-700 transition-colors uppercase tracking-wide disabled:opacity-50"
                        >
                          Remove Assignment
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Manual Assignment Section */}
            <div className="mt-6 pt-5 border-t border-gray-100">
               <h3 className="text-[14px] font-semibold text-near-black mb-3">Manual BC Assignment</h3>
               <div className="flex flex-col sm:flex-row items-start gap-3">
                 <div className="relative flex-1 w-full">
                   <input
                     type="text"
                     placeholder="Search by name or email..."
                     value={bcSearch}
                     onFocus={() => setShowBcDropdown(true)}
                     onBlur={() => setTimeout(() => setShowBcDropdown(false), 200)}
                     onChange={(e) => {
                       setBcSearch(e.target.value);
                       if (selectedBcId) setSelectedBcId("");
                     }}
                     className="w-full h-10 rounded-full border border-gray-200 bg-white text-[14px] px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                   />
                   {(showBcDropdown && bcSearch.length >= 2) && (
                     <div className="absolute z-10 top-full left-0 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                       {filteredBCs.length > 0 ? (
                         filteredBCs.map((bc: any) => (
                           <div 
                             key={bc.id}
                             onClick={() => {
                               setSelectedBcId(bc.id);
                               setBcSearch(`${bc.first_name} ${bc.last_name}`);
                               setShowBcDropdown(false);
                             }}
                             className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                           >
                             <div className="text-[14px] font-medium text-near-black">{bc.first_name} {bc.last_name}</div>
                             <div className="text-[12px] text-gray-500">{bc.contact_email}</div>
                             <div className="text-[12px] text-gray-400 mt-1">Practice: €{bc.practice_fee || 0} · Home: €{bc.home_visit_fee || 0}</div>
                           </div>
                         ))
                       ) : (
                         <div className="px-4 py-3 text-[13px] text-gray-500 italic">No BCs found matching '{bcSearch}'</div>
                       )}
                     </div>
                   )}
                 </div>
                 <button 
                   onClick={() => {
                     const selectedBC = allActiveBCs?.find((b: any) => b.id === selectedBcId);
                     if (selectedBC && window.confirm(`Are you sure you want to forcibly assign ${selectedBC.first_name} ${selectedBC.last_name} to this recommendation? This bypasses the normal application flow and immediately notifies both the BC and Healthcare Company.`)) {
                       handleBcAction({ action: 'assign_bc', bc_id: selectedBcId });
                     }
                   }}
                   disabled={!selectedBcId || bcActionLoading}
                   className="w-full sm:w-auto shrink-0 bg-primary text-white px-5 rounded-full h-10 font-semibold hover:bg-primary-dark transition-all shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px] flex items-center justify-center disabled:opacity-50 text-[13px]"
                 >
                   {bcActionLoading && selectedBcId ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : null}
                   Assign BC
                 </button>
               </div>
            </div>
         </div>

         {/* Timeline */}
         <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-400" />
              <h2 className="text-[15px] font-semibold text-near-black">Audit Timeline</h2>
            </div>
            <div className="relative border-l-2 border-gray-200 ml-2 space-y-6 pt-2 pb-2">
              {sortedTimeline.length === 0 && <div className="pl-6 text-[13px] text-gray-400 italic">No events.</div>}
              {sortedTimeline.map((item, i) => (
                <div key={i} className="relative pl-6">
                  <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${item.color || 'bg-gray-300'}`} />
                  <div className="text-[11px] font-bold text-gray-400 tracking-wide uppercase">
                    {item.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {item.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[13px] font-semibold text-near-black mt-1">{item.title}</div>
                  <div className="text-[12px] text-gray-600 leading-snug">{item.desc}</div>
                </div>
              ))}
            </div>
         </div>
      </div>

      {/* Critical Actions */}
      <div className="mt-6 border-t border-gray-200 pt-6">
         <h2 className="text-[15px] font-semibold text-near-black mb-4">System Actions</h2>
         <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to forcibly CANCEL this recommendation? This cannot be undone.")) {
                  handlePatch({ status: 'cancelled' }, setActionLoading);
                }
              }}
              disabled={actionLoading || recommendationData.status === 'cancelled'}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 px-5 rounded-full h-9 font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Cancel Recommendation
            </button>
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to FORCE REOPEN this recommendation? This resets the status to 'created'.")) {
                  handlePatch({ status: 'created' }, setActionLoading);
                }
              }}
              disabled={actionLoading || recommendationData.status !== 'cancelled'}
              className="w-full sm:w-auto bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black disabled:opacity-50 px-5 rounded-full h-9 font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Reopen Created
            </button>
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to FORCE COMPLETE this recommendation? This cannot be undone.")) {
                  handlePatch({ status: 'completed' }, setActionLoading);
                }
              }}
              disabled={actionLoading || recommendationData.status === 'completed' || recommendationData.status === 'cancelled'}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 px-5 rounded-full h-9 font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Force Complete
            </button>
         </div>
      </div>
    </div>
  );
}
