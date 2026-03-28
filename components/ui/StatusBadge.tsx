import React from 'react';

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  // Recommendation statuses
  created: { label: 'DRAFT', bg: '#F3F4F6', text: '#6E7280' },
  sent: { label: 'SENT', bg: '#EFF6FF', text: '#2563EB' },
  expired: { label: 'EXPIRED', bg: '#F3F4F6', text: '#6E7280' },

  // Order statuses
  paid: { label: 'PAID', bg: '#E8F5F5', text: '#008085' },
  preparing: { label: 'PREPARING', bg: '#FFF7ED', text: '#D97706' },
  kit_shipped: { label: 'KIT SHIPPED', bg: '#E8F5F5', text: '#008085' },
  collection_organized: { label: 'COLLECTION ORG.', bg: '#EFF6FF', text: '#2563EB' },
  awaiting_collection: { label: 'AWAITING COLLECTION', bg: '#FFF7ED', text: '#D97706' },
  returning_to_lab: { label: 'RETURNING TO LAB', bg: '#FFF7ED', text: '#D97706' },
  at_lab: { label: 'AT LAB', bg: '#EFF6FF', text: '#2563EB' },
  results_ready: { label: 'RESULTS READY', bg: '#F0FDF4', text: '#16A34A' },
  completed: { label: 'COMPLETED', bg: '#F0FDF4', text: '#16A34A' },
  cancelled: { label: 'CANCELLED', bg: '#F3F4F6', text: '#6E7280' },
};

export function StatusBadge({ status, className = "" }: { status: string, className?: string }) {
  const normStatus = (status || "").toLowerCase();
  const conf = statusConfig[normStatus] || {
    label: normStatus.toUpperCase() || "UNKNOWN",
    bg: '#F3F4F6',
    text: '#6E7280'
  };

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] font-body text-[11px] font-semibold uppercase tracking-wider ${className}`}
      style={{ backgroundColor: conf.bg, color: conf.text }}
    >
      {conf.label}
    </span>
  );
}
