"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, User, RefreshCw, RefreshCcw, Building2, ChevronDown } from "lucide-react";
import { RejectionModal } from "./RejectionModal";
import { useTranslations } from "next-intl";

export default function VerificationQueue() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected' | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'hc' | 'bc'>('all'); // NEW
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hcs, setHcs] = useState<any[]>([]);
  const [bcs, setBcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    userId: string;
    type: 'hc' | 'bc';
    userName: string;
  }>({
    isOpen: false,
    userId: '',
    type: 'hc',
    userName: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verifications');
      if (res.ok) {
        const data = await res.json();
        setHcs(data.hcs || []);
        setBcs(data.bcs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action: 'approve' | 'reset_to_pending', userId: string, type: 'hc' | 'bc') => {
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, type })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmRejection = async (reasons: string[], notes: string) => {
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject', 
          userId: modalState.userId, 
          type: modalState.type,
          reasons,
          notes
        })
      });
      if (res.ok) {
        setModalState({ ...modalState, isOpen: false });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const allUsers = [
    ...hcs.map(h => ({ ...h, _type: 'hc' as const })),
    ...bcs.map(b => ({ ...b, _type: 'bc' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const displayUsers = allUsers.filter(u => {
    if (activeTab !== 'all' && u.status !== activeTab) return false;
    if (typeFilter !== 'all' && u._type !== typeFilter) return false;
    return true;
  });

  const pendingCount = allUsers.filter(u => u.status === 'pending').length;
  const rejectedCount = allUsers.filter(u => u.status === 'rejected').length;
  const allCount = allUsers.length;

  const renderCard = (user: any) => {
    const isHC = user._type === 'hc';
    const name = isHC ? user.name : `${user.first_name} ${user.last_name}`;
    const subName = isHC ? (user.type || 'Healthcare Company') : (user.qualification ? String(user.qualification).toUpperCase() : "Practitioner");
    const email = user.contact_email;
    const isRejected = user.status === 'rejected';

    const dateField = isRejected ? user.rejected_at : user.created_at;
    const dateStr = dateField ? new Date(dateField).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown Date';

    let rejectionData: any = null;
    if (isRejected && user.rejection_reason) {
      try {
        rejectionData = JSON.parse(user.rejection_reason);
      } catch (e) {
        console.error("Failed to parse rejection reason");
      }
    }
    
    // BC Initials
    const bcInitials = !isHC && user.first_name && user.last_name 
      ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` 
      : 'BC';

    const isExpanded = expandedId === user.id;

    const toggleExpand = () => {
      setExpandedId(isExpanded ? null : user.id);
    };

    return (
      <div 
        key={`${user.id}-${user._type}`} 
        className={`bg-white border hover:border-gray-300 rounded-xl p-4 transition-all duration-200 ${isExpanded ? 'border-gray-300 ring-1 ring-gray-200 shadow-sm' : 'border-gray-200 hover:shadow-sm'}`}
      >
        <div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer"
          onClick={toggleExpand}
        >
          <div className="flex items-start gap-3 w-full sm:w-auto min-w-0">
            {/* Avatar / Icon */}
            <div className="shrink-0 mt-0.5">
              {isHC ? (
                <div className="w-[36px] h-[36px] rounded-lg bg-[#FEF0F2] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#008085]" strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-[36px] h-[36px] rounded-full bg-[#E6F5F5] flex items-center justify-center">
                  <span className="text-[13px] font-medium text-primary">{bcInitials}</span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 pr-6 sm:pr-0 relative flex-wrap">
                <span className="text-[15px] font-medium text-near-black leading-tight">{name}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 absolute right-0 top-0 sm:hidden ${isExpanded ? 'rotate-180' : ''}`} />
                
                {/* Badges */}
                <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-2 py-0.5 rounded uppercase">
                  {subName.replace(/_/g, " ")}
                </span>
                {isHC ? (
                  <span className="bg-[#FEF0F2] text-[#008085] text-[11px] font-semibold px-2 py-0.5 rounded">Doctor</span>
                ) : (
                  <span className="bg-primary/10 text-primary text-[11px] font-semibold px-2 py-0.5 rounded">BC</span>
                )}
                {isRejected && (
                  <span className="bg-red-50 text-red-700 text-[11px] font-semibold px-2 py-0.5 rounded uppercase">REJECTED</span>
                )}
                {!isRejected && user.status === 'pending' && (
                  <span className="bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded uppercase">PENDING</span>
                )}
              </div>

              {/* Details line */}
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-gray-500 leading-snug">
                <span>{email}</span>
                <span className="text-gray-300">·</span>
                <span className="text-[12px] text-gray-400">{dateStr}</span>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-3">
                  {user.signedDocs && user.signedDocs.length > 0 ? (
                    user.signedDocs.map((d: any, idx: number) => (
                      <div key={d.id} className="flex items-center gap-1">
                        <span className="flex items-center gap-1 text-[12px] text-blue-600">
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[120px] capitalize">{d.document_type.replace(/_/g, " ")}</span>
                        </span>
                        {idx < user.signedDocs.length - 1 && <span className="text-gray-300 ml-2">·</span>}
                      </div>
                    ))
                  ) : (
                    <span className="text-[12px] text-gray-400 italic">No docs</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 sm:pl-4">
            <ChevronDown className={`hidden sm:block w-5 h-5 text-gray-400 transition-transform duration-200 mr-2 ${isExpanded ? 'rotate-180' : ''}`} />
            {isRejected ? (
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction('reset_to_pending', user.id, user._type); }}
                className="flex-1 sm:flex-none justify-center bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black rounded-full px-3 sm:px-4 py-1.5 text-[12px] sm:text-[13px] font-semibold transition-all flex items-center gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Re-review
              </button>
            ) : (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction('approve', user.id, user._type); }}
                  className="flex-1 sm:flex-none text-center bg-green-600 hover:bg-green-700 text-white rounded-full px-3 sm:px-4 py-1.5 text-[12px] sm:text-[13px] font-semibold transition-all"
                >
                  {t('admin.approve')}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setModalState({ isOpen: true, userId: user.id, type: user._type, userName: name }); }}
                  className="flex-1 sm:flex-none text-center bg-red-600 hover:bg-red-700 text-white rounded-full px-3 sm:px-4 py-1.5 text-[12px] sm:text-[13px] font-semibold transition-all"
                >
                  {t('admin.reject')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Rejection Reasons Container */}
        {isRejected && rejectionData && !isExpanded && (
          <div className="mt-3 bg-red-50/50 rounded-lg p-3 border border-red-100 ml-[52px]">
            {rejectionData.reasons?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {rejectionData.reasons.map((r: string, idx: number) => (
                  <span key={idx} className="bg-white border border-red-200 text-red-700 text-[12px] px-2.5 py-1 rounded-md shadow-sm">
                    {r}
                  </span>
                ))}
              </div>
            )}
            {rejectionData.notes && (
              <p className="text-[13px] text-red-600/80 italic mt-1">
                "{rejectionData.notes}"
              </p>
            )}
          </div>
        )}

        {/* Expanded Details Section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile details */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('admin.profileDetails')}</h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {isHC ? (
                    <>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Name</div>
                        <div className="text-[14px] text-near-black">{user.name || <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Type</div>
                        <div className="text-[14px] text-near-black capitalize">{user.type ? user.type.replace(/_/g, " ") : <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Contact Email</div>
                        <div className="text-[14px] text-near-black">{user.contact_email || <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Phone</div>
                        <div className="text-[14px] text-near-black">{user.phone || <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Address</div>
                        <div className="text-[14px] text-near-black">
                          {user.address ? `${user.address.street || ''}, ${user.address.zip || ''} ${user.address.city || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') : <span className="text-gray-300">—</span>}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Full Name</div>
                        <div className="text-[14px] text-near-black">{user.first_name} {user.last_name}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Qualification</div>
                        <div className="text-[14px] text-near-black uppercase">{user.qualification || <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Contact Email</div>
                        <div className="text-[14px] text-near-black">{user.contact_email || <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Phone</div>
                        <div className="text-[14px] text-near-black">{user.phone || <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Service Area</div>
                        <div className="text-[14px] text-near-black">{user.service_area?.city || <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Offers</div>
                        <div className="text-[14px] text-near-black">
                          {[user.offers_home_visits ? "Home visits" : null, user.offers_practice_visits ? "Practice visits" : null].filter(Boolean).join(", ") || <span className="text-gray-300">—</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Practice Fee</div>
                        <div className="text-[14px] text-near-black">{user.practice_fee ? `€${Number(user.practice_fee).toFixed(2)}` : <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-400 mb-0.5">Home Visit Fee</div>
                        <div className="text-[14px] text-near-black">{user.home_visit_fee ? `€${Number(user.home_visit_fee).toFixed(2)}` : <span className="text-gray-300">—</span>}</div>
                      </div>
                    </>
                  )}
                </div>

                {isRejected && rejectionData && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Rejection History</h4>
                    <div className="bg-red-50/50 rounded-lg p-3 border border-red-100">
                      {rejectionData.reasons?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {rejectionData.reasons.map((r: string, idx: number) => (
                            <span key={idx} className="bg-white border border-red-200 text-red-700 text-[12px] px-2.5 py-1 rounded-md shadow-sm">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                      {rejectionData.notes && (
                        <p className="text-[13px] text-red-600/80 italic mt-1">
                          "{rejectionData.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Verification documents */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('admin.verificationDocuments')}</h4>
                {user.signedDocs && user.signedDocs.length > 0 ? (
                  <div className="space-y-2">
                    {user.signedDocs.map((d: any) => (
                      <div key={d.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-[13px] font-medium text-near-black capitalize">
                            {d.document_type.replace(/_/g, " ")}
                          </span>
                        </div>
                        {d.url ? (
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-600 hover:underline font-medium">
                            {t('admin.viewDocument')}
                          </a>
                        ) : (
                          <span className="text-[12px] text-gray-400 italic cursor-not-allowed">
                            No document uploaded
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center flex flex-col items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-300 mb-2" />
                    <span className="text-[13px] text-gray-400">{t('admin.noDocuments')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions row */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              {isRejected ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction('reset_to_pending', user.id, user._type); }}
                  className="bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all flex items-center gap-1.5"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Re-review
                </button>
              ) : (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction('approve', user.id, user._type); }}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setModalState({ isOpen: true, userId: user.id, type: user._type, userName: name }); }}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-w-0 w-full font-body">
      <div className="mb-8">
        <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight">{t('admin.verifications')}</h1>
        <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1">{t('admin.verificationsSubtitle')}</p>
      </div>

      <div className="flex overflow-x-auto gap-0 border-b border-gray-200 mb-6" style={{ scrollbarWidth: 'none' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 text-[14px] font-semibold whitespace-nowrap shrink-0 transition-colors border-b-2 ${activeTab === 'pending' ? 'border-[#008085] text-[#008085]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          {t('admin.pending')} ({pendingCount})
        </button>
        <button 
          onClick={() => setActiveTab('rejected')}
          className={`px-6 py-3 text-[14px] font-semibold whitespace-nowrap shrink-0 transition-colors border-b-2 ${activeTab === 'rejected' ? 'border-[#008085] text-[#008085]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          {t('admin.rejected')} ({rejectedCount})
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 text-[14px] font-semibold whitespace-nowrap shrink-0 transition-colors border-b-2 ${activeTab === 'all' ? 'border-[#008085] text-[#008085]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          {t('common.all')} ({allCount})
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button 
           onClick={() => setTypeFilter('all')}
           className={`rounded-full px-4 py-1.5 text-[13px] font-semibold cursor-pointer transition-colors ${typeFilter === 'all' ? 'bg-[#1A1D23] text-white border border-[#1A1D23]' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
        >
          {t('admin.allTypes')}
        </button>
        <button 
           onClick={() => setTypeFilter('hc')}
           className={`rounded-full px-4 py-1.5 text-[13px] font-semibold cursor-pointer transition-colors ${typeFilter === 'hc' ? 'bg-[#1A1D23] text-white border border-[#1A1D23]' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
        >
          <span className="sm:hidden">HCs</span>
          <span className="hidden sm:inline">{t('admin.healthcareCompanies')}</span>
        </button>
        <button 
           onClick={() => setTypeFilter('bc')}
           className={`rounded-full px-4 py-1.5 text-[13px] font-semibold cursor-pointer transition-colors ${typeFilter === 'bc' ? 'bg-[#1A1D23] text-white border border-[#1A1D23]' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
        >
          <span className="sm:hidden">BCs</span>
          <span className="hidden sm:inline">{t('admin.bloodCollectors')}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center text-gray-500">
           <div className="w-8 h-8 flex items-center justify-center animate-spin">
             <RefreshCw className="w-6 h-6 text-gray-400" />
           </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayUsers.length === 0 ? (
            <div className="text-[14px] text-gray-400 italic py-12 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
               No {activeTab} users found for the selected type.
            </div>
          ) : (
            displayUsers.map(user => renderCard(user))
          )}
        </div>
      )}

      <RejectionModal 
        isOpen={modalState.isOpen}
        type={modalState.type}
        userName={modalState.userName}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={handleConfirmRejection}
      />
    </div>
  );
}
