"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreVertical, Eye, Edit2, Webhook, KeyRound, Ban, Trash2,
  Loader2, AlertTriangle, X, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface UserActionsDropdownProps {
  user: any;
  type: 'doctor' | 'patient';
  onEdit: () => void;
  onActionComplete: () => void;
}

export default function UserActionsDropdown({ user, type, onEdit, onActionComplete }: UserActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: string;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'primary';
  }>({ open: false, action: '', title: '', message: '', confirmLabel: '', variant: 'danger' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => { setMounted(true); }, []);



  const isSuspended = !user.is_active;
  const userName = type === 'doctor' ? user.full_name : `${user.first_name} ${user.last_name}`;

  const handleAction = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmModal.action, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setActionResult({ success: true, message: data.message });
      setTimeout(() => {
        setConfirmModal({ ...confirmModal, open: false });
        setActionResult(null);
        onActionComplete();
      }, 1500);
    } catch (err: any) {
      setActionResult({ success: false, message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (action: string, title: string, message: string, confirmLabel: string, variant: 'danger' | 'primary' = 'danger') => {
    setOpen(false);
    setConfirmModal({ open: true, action, title, message, confirmLabel, variant });
    setActionResult(null);
  };

  const detailPath = type === 'doctor' ? `/admin/users/doctors/${user.id}` : `/admin/users/patients/${user.id}`;
  const webhooksPath = `/admin/users/doctors/${user.id}/webhooks`;

  const menuItems = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: () => { setOpen(false); router.push(detailPath); },
      show: true,
    },
    {
      label: 'Edit Profile',
      icon: Edit2,
      onClick: () => { setOpen(false); onEdit(); },
      show: true,
    },
    {
      label: 'Webhooks & API',
      icon: Webhook,
      onClick: () => { setOpen(false); router.push(webhooksPath); },
      show: type === 'doctor',
    },
    { separator: true, show: true },
    {
      label: 'Reset Password',
      icon: KeyRound,
      onClick: () => openConfirm(
        'reset_password',
        'Reset Password',
        `Send a password reset email to ${userName} (${user.email})?`,
        'Send Reset Email',
        'primary'
      ),
      show: true,
    },
    {
      label: isSuspended ? 'Reactivate User' : 'Suspend User',
      icon: isSuspended ? RotateCcw : Ban,
      onClick: () => openConfirm(
        isSuspended ? 'reactivate' : 'suspend',
        isSuspended ? 'Reactivate User' : 'Suspend User',
        isSuspended
          ? `Reactivate ${userName}? They will regain access to the platform.`
          : `Suspend ${userName}? They will lose access to the platform immediately.`,
        isSuspended ? 'Reactivate' : 'Suspend',
        isSuspended ? 'primary' : 'danger'
      ),
      show: true,
      className: isSuspended ? '' : 'text-amber-600 hover:bg-amber-50',
    },
    {
      label: 'Delete User',
      icon: Trash2,
      onClick: () => openConfirm(
        'delete',
        'Delete User',
        `Permanently delete ${userName}? This action cannot be undone. All associated data will be affected.`,
        'Delete User',
        'danger'
      ),
      show: true,
      className: 'text-red-600 hover:bg-red-50',
    },
  ];

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          className="p-2 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {open && mounted && createPortal(
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
          >
            <div
              className="absolute w-52 bg-white border border-gray-200 rounded-[12px] shadow-lg py-1 overflow-hidden"
              style={{
                top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 4 : 0,
                left: buttonRef.current ? buttonRef.current.getBoundingClientRect().right - 208 : 0,
              }}
              onClick={e => e.stopPropagation()}
            >
              {menuItems.filter(item => item.show).map((item, i) => {
                if ('separator' in item && item.separator) {
                  return <div key={`sep-${i}`} className="border-t border-gray-100 my-1" />;
                }
                const Icon = item.icon!;
                return (
                  <button
                    key={item.label}
                    onClick={(e) => { e.stopPropagation(); item.onClick!(); }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-2.5 transition-colors ${
                      item.className || 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={() => !actionLoading && setConfirmModal({ ...confirmModal, open: false })}>
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                confirmModal.variant === 'danger' ? 'bg-red-50' : 'bg-primary/10'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${confirmModal.variant === 'danger' ? 'text-red-500' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="font-heading font-medium text-[18px] text-near-black" style={{ textTransform: 'none' }}>{confirmModal.title}</h3>
                <p className="text-[14px] text-gray-600 mt-1">{confirmModal.message}</p>
              </div>
            </div>

            {actionResult && (
              <div className={`mb-4 p-3 rounded-[10px] text-[13px] font-medium ${
                actionResult.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {actionResult.message}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="rounded-full px-5 h-10 text-[14px]"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={confirmModal.variant === 'danger' ? 'danger' : 'primary'}
                onClick={handleAction}
                className="rounded-full px-5 h-10 text-[14px]"
                disabled={actionLoading || actionResult?.success}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                {confirmModal.confirmLabel}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
