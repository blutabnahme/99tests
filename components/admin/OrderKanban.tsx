"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Package, Truck, FlaskConical, CheckCircle2, CreditCard } from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'awaiting_payment', label: 'Awaiting Payment', icon: Clock, color: 'amber', statuses: ['awaiting_payment'] },
  { id: 'preparing', label: 'Preparing', icon: Package, color: 'blue', statuses: ['preparing'] },
  { id: 'shipped', label: 'Shipped', icon: Truck, color: 'teal', statuses: ['kit_shipped'] },
  { id: 'at_lab', label: 'At Lab', icon: FlaskConical, color: 'purple', statuses: ['collection_organized', 'awaiting_collection', 'collecting', 'returning_to_lab', 'at_lab'] },
  { id: 'results', label: 'Results Ready', icon: CheckCircle2, color: 'green', statuses: ['results_ready'] },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string; headerBg: string }> = {
  amber:  { bg: 'bg-amber-50/50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400',  headerBg: 'bg-amber-50' },
  blue:   { bg: 'bg-blue-50/50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-400',   headerBg: 'bg-blue-50' },
  teal:   { bg: 'bg-teal-50/50',   border: 'border-teal-200',   text: 'text-teal-700',   dot: 'bg-teal-400',   headerBg: 'bg-teal-50' },
  purple: { bg: 'bg-purple-50/50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-400', headerBg: 'bg-purple-50' },
  green:  { bg: 'bg-green-50/50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-400',  headerBg: 'bg-green-50' },
};

function formatCurrency(n: number): string {
  return `€${n.toFixed(2)}`;
}

function formatDateShort(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function PipelineMiniDots({ status }: { status: any }) {
  if (!status || typeof status !== 'object') return null;
  const steps = ['materials', 'anamnese_pdf', 'ldt_file', 'pad_pvs', 'dhl_label'];
  return (
    <div className="flex items-center gap-0.5 mt-1.5">
      {steps.map(step => {
        const s = status[step];
        const color = s?.status === 'completed' ? 'bg-green-400'
          : s?.status === 'failed' ? 'bg-red-400'
          : s?.status === 'skipped' ? 'bg-yellow-400'
          : 'bg-gray-200';
        return <div key={step} className={`w-1.5 h-1.5 rounded-full ${color}`} />;
      })}
    </div>
  );
}

function formatPayment(m: string): string {
  const map: Record<string, string> = { credit_card: 'Card', card: 'Card', sepa: 'SEPA', bank_transfer: 'Bank' };
  return map[m] || m || '';
}

interface OrderKanbanProps {
  orders: any[];
}

export default function OrderKanban({ orders }: OrderKanbanProps) {
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());

  const toggleColumn = (colId: string) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  // Group orders by column
  const columns = KANBAN_COLUMNS.map(col => ({
    ...col,
    orders: orders.filter(o => col.statuses.includes(o.status)),
  }));

  // Auto-collapse empty columns on mount / data change
  useEffect(() => {
    const emptyCols = new Set<string>();
    columns.forEach(col => {
      if (col.orders.length === 0) emptyCols.add(col.id);
    });
    setCollapsedCols(emptyCols);
  }, [orders]);

  return (
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Order Pipeline</h2>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-3 min-w-[600px]">
          {columns.map(col => {
            const colors = COLOR_MAP[col.color] || COLOR_MAP.blue;
            const Icon = col.icon;
            const isCollapsed = collapsedCols.has(col.id);

            return (
              <div key={col.id} className={`${isCollapsed ? 'w-[48px] shrink-0' : 'flex-1 min-w-[170px]'} overflow-hidden`} style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                {isCollapsed ? (
                  /* Collapsed column */
                  <div
                    onClick={() => toggleColumn(col.id)}
                    className={`h-full rounded-[12px] border ${colors.border} ${colors.bg} flex flex-col items-center py-3 gap-2 cursor-pointer hover:opacity-80 transition-all duration-300`}
                  >
                    <Icon className={`w-4 h-4 ${colors.text} opacity-60`} />
                    <span className={`text-[11px] font-bold ${colors.text}`}>{col.orders.length}</span>
                    <span className={`text-[10px] font-medium ${colors.text} opacity-50 [writing-mode:vertical-lr] rotate-180 mt-1`}>{col.label}</span>
                  </div>
                ) : (
                  <div className={`rounded-[12px] border ${colors.border} overflow-hidden`}>
                    {/* Column header — clickable to collapse */}
                    <div
                      onClick={() => toggleColumn(col.id)}
                      className={`${colors.headerBg} px-3 py-2.5 flex items-center justify-between cursor-pointer hover:opacity-80 transition-all duration-300`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                        <span className={`text-[13px] font-semibold ${colors.text}`}>{col.label}</span>
                      </div>
                      <span className={`text-[12px] font-bold ${colors.text} bg-white/60 px-1.5 py-0.5 rounded-full`}>
                        {col.orders.length}
                      </span>
                    </div>

                    {/* Cards container */}
                    <div className={`${colors.bg} p-2 space-y-2 min-h-[100px]`}>
                      {col.orders.length === 0 ? (
                        <div className="text-center text-[12px] text-gray-400 py-4 italic">No orders</div>
                      ) : (
                        <>
                          {col.orders.slice(0, 8).map(order => (
                            <Link
                              key={order.id}
                              href={`/admin/orders/${order.id}`}
                              className="block bg-white rounded-[10px] px-3.5 py-2.5 border border-gray-100 hover:border-primary/40 hover:shadow-md hover:-translate-y-px hover:bg-gradient-to-br hover:from-white hover:to-primary/[0.02] active:translate-y-0 active:shadow-sm transition-all duration-200 ease-out cursor-pointer will-change-transform"
                            >
                              <div className="text-[13px] font-medium text-near-black truncate">
                                {order.patient?.first_name} {order.patient?.last_name}
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="font-mono text-[11px] text-primary font-semibold">
                                  {order.display_id || order.id?.substring(0, 8)}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {formatDateShort(order.created_at)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[12px] font-mono text-gray-600">
                                  {order.total != null ? formatCurrency(Number(order.total)) : ''}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                  {formatPayment(order.payment_method)}
                                </span>
                              </div>
                              <PipelineMiniDots status={order.preparation_status} />
                            </Link>
                          ))}
                          {col.orders.length > 8 && (
                            <Link
                              href="/admin/orders"
                              className={`block w-full text-center py-2 text-[12px] font-semibold ${colors.text} hover:underline`}
                            >
                              +{col.orders.length - 8} more →
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
