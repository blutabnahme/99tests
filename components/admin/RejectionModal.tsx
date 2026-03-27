"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  userName
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasons: string[], freeText: string) => void;
  type: 'hc' | 'bc';
  userName: string;
}) {
  const t = useTranslations();
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const hcReasons = [
    "Incomplete business registration documents",
    "Invalid or expired medical license",
    "Company address could not be verified",
    "Missing tax registration (Steuernummer)",
    "Duplicate account detected"
  ];

  const bcReasons = [
    "Qualification documents not provided",
    "Qualification expired or invalid",
    "Identity verification failed",
    "Missing professional liability insurance",
    "Incomplete profile information"
  ];

  const reasons = type === 'hc' ? hcReasons : bcReasons;

  const toggleReason = (reason: string) => {
    const newSet = new Set(selectedReasons);
    if (newSet.has(reason)) {
      newSet.delete(reason);
    } else {
      newSet.add(reason);
    }
    setSelectedReasons(newSet);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedReasons), notes);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#1A1D23]/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[520px] p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
        <div className="mb-5">
          <h2 className="font-heading text-[18px] font-medium text-near-black mb-1">{t('admin.rejectTitle')} {userName}?</h2>
          <p className="text-[14px] text-gray-500">
            {t('admin.rejectSubtitle')}
          </p>
        </div>

        <div className="space-y-2.5 mb-5">
          {reasons.map(r => {
            const checked = selectedReasons.has(r);
            return (
              <label 
                key={r} 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  checked ? 'border-[#008085] bg-[#008085]/5' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex h-5 items-center">
                  <input 
                    type="checkbox" 
                    checked={checked}
                    onChange={() => toggleReason(r)}
                    className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085] accent-[#008085]"
                  />
                </div>
                <div className="text-[14px] font-medium text-near-black leading-tight mt-0.5 select-none">{r}</div>
              </label>
            );
          })}
        </div>

        <div className="mb-6">
          <label className="block text-[13px] font-medium text-gray-700 mb-2">Additional notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Provide additional context..."
            className="w-full h-20 border border-gray-200 rounded-xl p-3 text-[14px] resize-none focus:border-[#008085] focus:outline-none focus:ring-1 focus:ring-[#008085]/10"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all"
          >
            {t('common.cancel')}
          </button>
          <button 
            onClick={handleConfirm}
            disabled={selectedReasons.size === 0}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm"
          >
            {t('admin.confirmRejection')}
          </button>
        </div>
      </div>
    </div>
  );
}
