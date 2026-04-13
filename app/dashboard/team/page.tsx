"use client";
import { useState, useEffect } from "react";
import { Users, Shield, Eye, Stethoscope, Briefcase, Plus, X, Clock, UserMinus, RefreshCw, MoreHorizontal, Mail, ChevronDown, CheckCircle2 } from "lucide-react";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/format-date';

const ROLE_CONFIG: Record<string, { label: string; description: string; color: string; bg: string; badgeBg: string; badgeText: string; icon: any }> = {
  doctor: {
    label: 'Doctor',
    description: 'Full clinical access — can create recommendations, manage patients, view and release results',
    color: 'text-[#008085]',
    bg: 'bg-gray-50',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-[#008085]',
    icon: Stethoscope,
  },
  manager: {
    label: 'Manager',
    description: 'Can create recommendations and manage patients, but cannot release results or add clinical notes',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-600',
    icon: Briefcase,
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access — can view patients, results, and invoices',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
    icon: Eye,
  },
};

export default function TeamManagementPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<'doctor' | 'manager' | 'viewer'>('viewer');
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

  // Close action menu on outside click
  useEffect(() => {
    const handler = () => setActionMenuOpen(null);
    if (actionMenuOpen) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [actionMenuOpen]);

  const inviteMember = async () => {
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await fetch('/api/doctor/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          first_name: inviteFirstName,
          last_name: inviteLastName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invite.');
      } else {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteFirstName('');
        setInviteLastName('');
        setInviteRole('viewer');
        fetchTeam();
      }
    } catch (err) {
      setInviteError('An unexpected error occurred.');
    } finally {
      setInviteLoading(false);
    }
  };

  const updateRole = async (memberId: string, role: string) => {
    setActionMenuOpen(null);
    try {
      await fetch('/api/doctor/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action: 'update_role', role }),
      });
      fetchTeam();
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const deactivateMember = async (memberId: string) => {
    setActionMenuOpen(null);
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      await fetch('/api/doctor/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action: 'deactivate' }),
      });
      fetchTeam();
    } catch (err) {
      console.error("Failed to deactivate member:", err);
    }
  };

  const resendInvite = async (memberId: string) => {
    setActionMenuOpen(null);
    try {
      await fetch('/api/doctor/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action: 'resend_invite' }),
      });
      fetchTeam();
    } catch (err) {
      console.error("Failed to resend invite:", err);
    }
  };

  const getActivityDescription = (log: any) => {
    const { action, details } = log;
    switch (action) {
      case 'invited':
        return <><span className="font-medium">{details?.email}</span> was invited as <span className="font-medium">{ROLE_CONFIG[details?.role]?.label || details?.role}</span></>;
      case 'role_changed':
        return <>Role changed to <span className="font-medium">{ROLE_CONFIG[details?.newRole]?.label || details?.newRole}</span></>;
      case 'deactivated':
        return <><span className="font-medium">{details?.email}</span> was removed from the team</>;
      case 'reactivated':
        return <><span className="font-medium">{details?.email}</span> was reactivated</>;
      default:
        return <>{action}</>;
    }
  };

  const getMemberInitials = (member: any) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    }
    return member.email.substring(0, 2).toUpperCase();
  };

  const getMemberDisplayName = (member: any) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.email;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="min-h-full bg-transparent font-body">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black">Team</h1>
            <p className="text-[13px] text-gray-500 mt-1">Manage your practice staff and their access permissions</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-full sm:w-auto bg-[#008085] hover:bg-[#005C5F] text-white rounded-full px-5 py-2.5 text-[13px] font-medium flex items-center justify-center gap-2 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Team Members */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-heading font-medium text-near-black">Members</span>
                <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {members.length}
                </span>
              </div>
            </div>

            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Users className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-[14px] text-gray-500 mb-1">No team members yet</p>
                <p className="text-[13px] text-gray-400 mb-4">Invite staff to help manage your practice</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#008085] text-white rounded-full px-5 py-2 text-[13px] font-medium hover:bg-[#005C5F] transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Invite Member
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {members.map(member => {
                  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
                  const RoleIcon = roleConfig.icon;
                  const isPending = member.invite_status === 'pending';

                  return (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors relative">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0 ${
                          isPending ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-[#008085]'
                        }`}>
                          {getMemberInitials(member)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-medium text-near-black">
                              {getMemberDisplayName(member)}
                            </span>
                            {isPending && (
                              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                Pending
                              </span>
                            )}
                          </div>
                          {member.first_name && (
                            <div className="text-[12px] text-gray-400">{member.email}</div>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${roleConfig.badgeBg} ${roleConfig.badgeText}`}>
                              {roleConfig.label}
                            </span>
                            {member.last_active_at && (
                              <span className="text-[11px] text-gray-400">
                                Active {formatDate(member.last_active_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === member.id ? null : member.id); }}
                          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>

                        {actionMenuOpen === member.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-[12px] border border-gray-200 shadow-lg p-1.5 z-50 min-w-[180px]">
                            {/* Role options */}
                            {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                              <button
                                key={key}
                                onClick={() => updateRole(member.id, key)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-[8px] transition-colors ${
                                  member.role === key ? 'bg-gray-50 text-near-black font-medium' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <config.icon className="w-3.5 h-3.5" />
                                {config.label}
                                {member.role === key && <CheckCircle2 className="w-3.5 h-3.5 text-[#008085] ml-auto" />}
                              </button>
                            ))}

                            <div className="border-t border-gray-100 my-1" />

                            {isPending && (
                              <button
                                onClick={() => resendInvite(member.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                Resend Invite
                              </button>
                            )}

                            <button
                              onClick={() => deactivateMember(member.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 rounded-[8px] transition-colors"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Activity Log */}
        <div>
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <span className="text-[15px] font-heading font-medium text-near-black">Activity</span>
            </div>

            {activity.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-[13px] text-gray-400">No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {activity.map((log: any) => (
                  <div key={log.id} className="px-5 py-3">
                    <div className="text-[13px] text-gray-600">
                      {getActivityDescription(log)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      {formatDate(log.created_at)}
                      {log.details?.performedBy && (
                        <span> · by {log.details.performedBy}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permissions Reference */}
          <div className="mt-4 bg-white rounded-[16px] border border-gray-200 shadow-sm p-5">
            <span className="text-[15px] font-heading font-medium text-near-black">Permissions</span>
            <div className="mt-3 space-y-3">
              {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div>
                      <div className={`text-[13px] font-medium ${config.color}`}>{config.label}</div>
                      <div className="text-[12px] text-gray-400 mt-0.5">{config.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-[16px] shadow-xl max-w-md w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-medium text-[18px] text-near-black">Invite Team Member</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">They'll receive an email to join your practice</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-4 space-y-4">
              {inviteError && (
                <div className="text-[13px] text-red-500 bg-red-50 rounded-[8px] px-3 py-2">{inviteError}</div>
              )}

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">First Name</label>
                  <input
                    type="text"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-[14px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Last Name</label>
                  <input
                    type="text"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-[14px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@practice.de"
                  required
                  className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-[14px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
                />
              </div>

              {/* Role selector */}
              <div>
                <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">Role</label>
                <div className="space-y-1.5">
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-4 p-5 rounded-[16px] border-2 text-left cursor-pointer transition-all ${
                          inviteRole === key ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="invite-role"
                          value={key}
                          checked={inviteRole === key}
                          onChange={() => setInviteRole(key as any)}
                          className="hidden"
                        />
                        <div className={`mt-0.5 p-2.5 rounded-full shrink-0 ${
                          inviteRole === key ? config.bg + ' ' + config.color : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className={`font-semibold text-[15px] ${inviteRole === key ? 'text-near-black' : 'text-gray-500'}`}>{config.label}</span>
                          <p className="text-[13px] text-gray-400 mt-0.5">{config.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200 hover:border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={inviteMember}
                disabled={!inviteEmail || inviteLoading}
                className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#008085] hover:bg-[#005C5F] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {inviteLoading ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                ) : (
                  <><Mail className="w-3.5 h-3.5" /> Send Invite</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
