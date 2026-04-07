"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import {
  Loader2, CheckCircle2, XCircle, RotateCcw, User,
  Building2, Phone, Mail, MapPin, FileText, ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'verified' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-500' : 'bg-amber-400';
  return <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />;
}

export default function VerificationsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected' | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rejection modal state
  const [rejectModal, setRejectModal] = useState<{ open: boolean; doctorId: string; doctorName: string }>({ open: false, doctorId: '', doctorName: '' });
  const [rejectReasons, setRejectReasons] = useState<string[]>([]);
  const [rejectNotes, setRejectNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verifications');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (action: string, doctorId: string) => {
    setActionLoading(doctorId);
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, doctorId }),
      });
      if (res.ok) await fetchData();
      else alert('Action failed');
    } catch (err) {
      alert('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading(rejectModal.doctorId);
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          doctorId: rejectModal.doctorId,
          reasons: rejectReasons,
          notes: rejectNotes,
        }),
      });
      if (res.ok) {
        setRejectModal({ open: false, doctorId: '', doctorName: '' });
        setRejectReasons([]);
        setRejectNotes('');
        await fetchData();
      } else alert('Rejection failed');
    } catch (err) {
      alert('Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const REJECTION_REASONS = [
    'Missing or invalid license number',
    'Practice information incomplete',
    'Could not verify identity',
    'Duplicate registration',
    'Other (see notes)',
  ];

  const filtered = doctors.filter(d => {
    const status = d.verification_status || 'pending';
    if (activeTab === 'pending') return status === 'pending';
    if (activeTab === 'rejected') return status === 'rejected';
    return true;
  });

  const pendingCount = doctors.filter(d => (d.verification_status || 'pending') === 'pending').length;
  const rejectedCount = doctors.filter(d => d.verification_status === 'rejected').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
          Doctor Verification
        </h1>
        <p className="text-gray-500 text-[14px] mt-1">Review and approve new doctor registrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-full p-1 w-fit">
        {[
          { id: 'pending' as const, label: 'Pending', count: pendingCount },
          { id: 'rejected' as const, label: 'Rejected', count: rejectedCount },
          { id: 'all' as const, label: 'All', count: doctors.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-near-black shadow-sm'
                : 'text-gray-500 hover:text-near-black'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-12 text-center">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">
            {activeTab === 'pending' ? 'No pending verifications' : activeTab === 'rejected' ? 'No rejected doctors' : 'No doctors found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const isExpanded = expandedId === doc.id;
            const status = doc.verification_status || 'pending';

            return (
              <div key={doc.id} className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
                {/* Summary row */}
                <div
                  className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusDot status={status} />
                      <h3 className="text-[15px] font-semibold text-near-black truncate">
                        {doc.full_name || 'Verification Request'}
                      </h3>
                    </div>
                    <div className="text-[13px] text-gray-500 truncate mt-0.5">
                      {doc.practice_name || 'No practice info'} • {doc.email}
                    </div>
                  </div>
                  <div>
                     {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/30">
                    <div className="mt-2 pt-2 flex items-center gap-2">
                      {status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => handleAction('verify', doc.id)}
                            disabled={actionLoading === doc.id}
                            className="rounded-full text-[13px] h-9"
                          >
                            {actionLoading === doc.id ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => setRejectModal({ open: true, doctorId: doc.id, doctorName: doc.full_name })}
                            className="rounded-full text-[13px] h-9"
                          >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      {status === 'rejected' && (
                        <Button
                          variant="secondary"
                          onClick={() => handleAction('reset_to_pending', doc.id)}
                          disabled={actionLoading === doc.id}
                          className="rounded-full text-[13px] h-9"
                        >
                          <RotateCcw className="w-4 h-4 mr-1.5" />
                          Reset to Pending
                        </Button>
                      )}
                      {status === 'verified' && (
                        <span className="text-[13px] text-green-600 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal.open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }}
          onClick={() => setRejectModal({ open: false, doctorId: '', doctorName: '' })}
        >
          <div
            className="bg-white rounded-[16px] shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-heading font-medium text-[18px] text-near-black mb-1">
              Reject Doctor
            </h3>
            <p className="text-[14px] text-gray-500 mb-5">
              {rejectModal.doctorName}
            </p>

            <div className="space-y-2 mb-5">
              <label className="text-[13px] font-medium text-gray-700">Reason(s)</label>
              {REJECTION_REASONS.map(reason => (
                <label key={reason} className="flex items-center gap-2 cursor-pointer text-[14px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={rejectReasons.includes(reason)}
                    onChange={e => {
                      if (e.target.checked) setRejectReasons([...rejectReasons, reason]);
                      else setRejectReasons(rejectReasons.filter(r => r !== reason));
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {reason}
                </label>
              ))}
            </div>

            <div className="mb-5">
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">Additional Notes</label>
              <textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                className="w-full min-h-[80px] p-3 text-[14px] rounded-[12px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Optional notes for the doctor..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => { setRejectModal({ open: false, doctorId: '', doctorName: '' }); setRejectReasons([]); setRejectNotes(''); }}
                className="rounded-full text-[14px] h-10 px-5"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={rejectReasons.length === 0 || actionLoading === rejectModal.doctorId}
                className="rounded-full text-[14px] h-10 px-5"
              >
                {actionLoading === rejectModal.doctorId ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
