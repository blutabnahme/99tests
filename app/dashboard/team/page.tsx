"use client";
import { useState, useEffect } from "react";
import { Users, Shield, Eye, FileText, Plus, X, Clock, UserMinus, RefreshCw, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from 'next-intl';

export default function TeamManagementPage() {
  const t = useTranslations('hc.team');
  const tc = useTranslations('common');
  const [members, setMembers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'case_manager' | 'viewer'>('viewer');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/doctor/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setActivity(data.activity || []);
      }
    } catch (err) {
      console.error("Failed to fetch team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const inviteMember = async () => {
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await fetch('/api/doctor/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || t('invite.failed'));
      } else {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('viewer');
        fetchTeam();
      }
    } catch (err) {
      setInviteError(t('invite.unexpectedError'));
    } finally {
      setInviteLoading(false);
    }
  };

  const updateRole = async (memberId: string, role: string) => {
    setActionMenuOpen(null);
    try {
      const res = await fetch('/api/doctor/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action: 'update_role', role })
      });
      if (res.ok) {
        fetchTeam();
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const deactivateMember = async (memberId: string) => {
    setActionMenuOpen(null);
    try {
      const res = await fetch('/api/doctor/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action: 'deactivate' })
      });
      if (res.ok) {
        fetchTeam();
      }
    } catch (err) {
      console.error("Failed to deactivate member:", err);
    }
  };

  const getActivityDescription = (log: any) => {
    const { action, details } = log;
    if (action === 'member_invited') {
      return (
        <>
          {t.rich('activityLogs.invited', { 
            email: () => <span className="font-semibold">{details.email}</span>,
            role: () => <span className="font-semibold">{details.role}</span>
          })}
        </>
      );
    }
    if (action === 'role_changed') {
      return (
        <>
          {t.rich('activityLogs.roleChanged', {
            newRole: () => <span className="font-semibold">{details.newRole}</span>
          })}
        </>
      );
    }
    if (action === 'member_deactivated') {
      return <>{t('activityLogs.removed')}</>;
    }
    if (action === 'member_reactivated') {
      return <>{t('activityLogs.reactivated')}</>;
    }
    return <>{action}</>;
  };

  return (
    <div className="min-h-full bg-transparent">
      {/* Header */}
      <div className="flex-1 min-w-0 w-full font-body">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight">{t('title')}</h1>
              <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1">{t('subtitle')}</p>
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white rounded-full px-5 py-2.5 text-[13px] font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" /> {t('inviteMember')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Team Members */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center text-[16px] font-medium text-near-black">
                    {t('members')}
                    <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full ml-2">
                      {members.length}
                    </span>
                  </div>
                </div>

                {members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Users className="w-10 h-10 text-gray-300 mb-3" />
                    <h3 className="text-[14px] font-medium text-gray-500 mb-1">{t('noMembers')}</h3>
                    <p className="text-[13px] text-gray-400 mb-4">{t('inviteSubtitle')}</p>
                    <button 
                      onClick={() => setShowInviteModal(true)}
                      className="bg-primary text-white rounded-full px-5 py-2 text-[13px] font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> {t('inviteMember')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {members.map(member => (
                      <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 relative">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                            member.status === 'pending' ? 'bg-gray-100 text-gray-400' : 'bg-[#E6F5F5] text-[#008085]'
                          }`}>
                            {member.email.substring(0, 2).toUpperCase()}
                          </div>
                          
                          <div className="flex flex-col">
                            <div className="text-[14px] font-medium text-near-black mb-0.5">
                              {member.email}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              {member.role === 'admin' && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FEF0F2] text-[#008085]">{t('roleAdmin')}</span>
                              )}
                              {member.role === 'case_manager' && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB]">{t('roleCaseManager')}</span>
                              )}
                              {member.role === 'viewer' && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-500">{t('roleViewer')}</span>
                              )}

                              {member.status === 'pending' && (
                                <span className="bg-[#FFF7ED] text-[#D97706] text-[11px] font-semibold px-2 py-0.5 rounded ml-2">{t('badges.pending')}</span>
                              )}
                            </div>
                            <div className="text-[12px] text-gray-400 flex items-center gap-1">
                               <Clock className="w-3 h-3" /> {t('invitedAgo', { time: formatDistanceToNow(new Date(member.invited_at)) })}
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <button 
                            onClick={() => setActionMenuOpen(actionMenuOpen === member.id ? null : member.id)}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer text-gray-500"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          {actionMenuOpen === member.id && (
                            <>
                              <div className="fixed inset-0 z-0" onClick={() => setActionMenuOpen(null)} />
                              <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                                {member.role !== 'admin' && (
                                  <button onClick={() => updateRole(member.id, 'admin')} className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                                    <Shield className="w-4 h-4" /> {t('actions.changeTo', { role: t('roleAdmin') })}
                                  </button>
                                )}
                                {member.role !== 'case_manager' && (
                                  <button onClick={() => updateRole(member.id, 'case_manager')} className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                                    <FileText className="w-4 h-4" /> {t('actions.changeTo', { role: t('roleCaseManager') })}
                                  </button>
                                )}
                                {member.role !== 'viewer' && (
                                  <button onClick={() => updateRole(member.id, 'viewer')} className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                                    <Eye className="w-4 h-4" /> {t('actions.changeTo', { role: t('roleViewer') })}
                                  </button>
                                )}
                                <div className="border-t border-gray-100 my-1" />
                                <button onClick={() => deactivateMember(member.id)} className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2">
                                  <UserMinus className="w-4 h-4" /> {t('removeMember')}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Activity */}
            <div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
                <div className="p-5 border-b border-gray-100">
                   <h2 className="text-[16px] font-medium text-near-black">{t('activity')}</h2>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto">
                  {activity.length === 0 ? (
                    <div className="text-[13px] text-gray-400 italic py-8 text-center">{t('noActivity')}</div>
                  ) : (
                    <div className="flex flex-col">
                      {activity.map(log => (
                        <div key={log.id} className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                          <div className="text-[13px] text-near-black mb-1">
                            {getActivityDescription(log)}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {log.actor_email} · {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setShowInviteModal(false); setInviteError(''); }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-[18px] font-medium text-near-black">{t('inviteModalTitle')}</h2>
            <p className="text-[14px] text-gray-500 mt-1 mb-6">{t('inviteModalSubtitle')}</p>

            <div className="mb-4">
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t('inviteModalPlaceholder')}
                className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-[14px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085]/10 outline-none"
              />
            </div>

            <div className="space-y-2 mt-4">
              <div 
                onClick={() => setInviteRole('admin')}
                className={`border-2 rounded-xl p-4 cursor-pointer flex items-center gap-3 transition-all ${
                  inviteRole === 'admin' ? 'border-primary bg-open-bg' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                }`}
              >
                 <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  inviteRole === 'admin' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                 }`}>
                    <Shield className="w-[18px] h-[18px]" strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                   <div className="text-[14px] font-medium text-near-black leading-tight">{t('roleAdmin')}</div>
                   <div className="text-[13px] text-gray-500 mt-0.5 leading-snug">{t('roleAdminDesc')}</div>
                 </div>
              </div>

              <div 
                onClick={() => setInviteRole('case_manager')}
                className={`border-2 rounded-xl p-4 cursor-pointer flex items-center gap-3 transition-all ${
                  inviteRole === 'case_manager' ? 'border-primary bg-open-bg' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                }`}
              >
                 <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  inviteRole === 'case_manager' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                 }`}>
                    <FileText className="w-[18px] h-[18px]" strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                   <div className="text-[14px] font-medium text-near-black leading-tight">{t('roleCaseManager')}</div>
                   <div className="text-[13px] text-gray-500 mt-0.5 leading-snug">{t('roleCaseManagerDesc')}</div>
                 </div>
              </div>

              <div 
                onClick={() => setInviteRole('viewer')}
                className={`border-2 rounded-xl p-4 cursor-pointer flex items-center gap-3 transition-all ${
                  inviteRole === 'viewer' ? 'border-primary bg-open-bg' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                }`}
              >
                 <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  inviteRole === 'viewer' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                 }`}>
                    <Eye className="w-[18px] h-[18px]" strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                   <div className="text-[14px] font-medium text-near-black leading-tight">{t('roleViewer')}</div>
                   <div className="text-[13px] text-gray-500 mt-0.5 leading-snug">{t('roleViewerDesc')}</div>
                 </div>
              </div>
            </div>

            {inviteError && (
              <div className="text-[13px] text-red-600 mt-3 font-medium">
                {inviteError}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => { setShowInviteModal(false); setInviteError(''); }}
                className="px-5 py-2.5 text-[13px] font-semibold text-gray-500 bg-transparent border border-gray-200 hover:border-gray-300 rounded-full hover:text-near-black transition-colors"
                disabled={inviteLoading}
              >
                {tc('cancel')}
              </button>
              <button 
                onClick={inviteMember}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="bg-primary text-white rounded-full px-5 py-2 text-[13px] font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                {inviteLoading ? t('inviteModalInviting') : t('inviteModalInviteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
