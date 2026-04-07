'use client';

import { useEffect } from 'react';

export interface ConfirmModalAction {
 label: string;
 onClick: () => void;
 variant: 'primary' | 'outline' | 'danger';
}

export interface ConfirmModalProps {
 open: boolean;
 onClose: () => void;
 title: string;
 description: string;
 actions: ConfirmModalAction[];
}

export function ConfirmModal({ open, onClose, title, description, actions }: ConfirmModalProps) {
 useEffect(() => {
 if (open) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = '';
 }
 return () => { document.body.style.overflow = ''; };
 }, [open]);

 if (!open) return null;

 const getButtonClasses = (variant: string) => {
 switch (variant) {
 case 'primary':
 return 'bg-[#008085] text-white hover:bg-[#005C5F] shadow-[0_4px_16px_rgba(0,128,133,0.25)]';
 case 'danger':
 return 'bg-red-500 text-white hover:bg-red-600';
 case 'outline':
 default:
 return 'bg-white text-[#1A1D23] border border-gray-200 hover:border-gray-300';
 }
 };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[999] m-0 p-0"
        style={{ margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[1000] m-0 p-0 pointer-events-none"
        style={{ margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div
          className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm pointer-events-auto mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-heading font-medium text-[#1A1D23] mb-2">
            {title}
          </h2>
          <p className="text-sm text-[#6E7280] mb-6">
            {description}
          </p>

          <div className="flex flex-col gap-2.5">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className={`w-full rounded-full py-3 px-6 text-sm font-semibold transition-colors ${getButtonClasses(action.variant)}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
