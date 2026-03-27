"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslations } from "next-intl";

type PaymentRow = {
  id: string;
  date: string;
  patientName: string;
  visitType: string;
  tests: string;
  subtotal: number;
  vat: number;
  total: number;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  case_count: number;
  org_fees_total: number;
  material_fees_total: number;
  logistics_fees_total: number;
  subtotal: number;
  vat: number;
  total: number;
  status: string;
  payments: PaymentRow[];
};

export default function InvoiceHistoryTable({ invoices }: { invoices: InvoiceRow[] }) {
  const t = useTranslations('hc.billing');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
         <h2 className="font-heading text-[18px] font-medium text-near-black">{t('historyTable.title')}</h2>
      </div>
      <div className="responsive-table-wrapper">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200 w-10"></th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.invoice')}</th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.period')}</th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.recommendations')}</th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.orgFees')}</th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.matLogFees')}</th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.subtotal')}</th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.vat')}</th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.total')}</th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.status')}</th>
              <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{t('historyTable.columns.action')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? invoices.map((inv) => (
               <React.Fragment key={inv.id}>
                 <tr 
                   className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                   onClick={() => toggleRow(inv.id)}
                 >
                   <td className="py-4 px-6">
                     <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {expandedRow === inv.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                     </div>
                   </td>
                   <td className="py-4 px-6">
                      <div className="font-bold text-[14px] text-near-black whitespace-nowrap flex items-center gap-2">
                         <FileText className="w-4 h-4 text-gray-500" />
                         {inv.invoice_number}
                      </div>
                   </td>
                   <td className="py-4 px-6 text-[13px] text-gray-500 font-medium whitespace-nowrap">
                      {new Date(inv.period_start).toLocaleDateString()} &mdash; {new Date(inv.period_end).toLocaleDateString()}
                   </td>
                   <td className="py-4 px-6 text-[14px] font-bold text-near-black">{inv.case_count}</td>
                   <td className="py-4 px-6 text-[13px] text-gray-500">€{inv.org_fees_total.toFixed(2)}</td>
                   <td className="py-4 px-6 text-[13px] text-gray-500">€{(inv.material_fees_total + inv.logistics_fees_total).toFixed(2)}</td>
                   <td className="py-4 px-6 text-[13px] text-gray-500">€{inv.subtotal.toFixed(2)}</td>
                   <td className="py-4 px-6 text-[13px] text-gray-500">€{inv.vat.toFixed(2)}</td>
                   <td className="py-4 px-6 font-bold text-[14px] text-near-black">€{inv.total.toFixed(2)}</td>
                   <td className="py-4 px-6">
                      <StatusBadge status={inv.status} />
                   </td>
                   <td className="py-4 px-6">
                      <Button variant="secondary" className="h-8 px-3 text-[12px] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                         <Download className="w-3.5 h-3.5" /> {t('historyTable.buttons.pdf')}
                      </Button>
                   </td>
                 </tr>

                 {expandedRow === inv.id && (
                   <tr className="bg-blue-50/30 border-b border-gray-200">
                      <td colSpan={11} className="py-6 px-16">
                         <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                               <h3 className="text-[13px] font-medium text-near-black flex items-center gap-2">
                                 {t('historyTable.includedCases.title')}
                               </h3>
                            </div>
                            <table className="w-full text-left">
                              <thead>
                                <tr>
                                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">{t('historyTable.includedCases.columns.date')}</th>
                                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">{t('historyTable.includedCases.columns.patient')}</th>
                                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">{t('historyTable.includedCases.columns.visit')}</th>
                                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">{t('historyTable.includedCases.columns.tests')}</th>
                                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200 text-right">{t('historyTable.includedCases.columns.fee')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inv.payments.map((p) => (
                                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 text-[12px] text-gray-500 font-medium">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 text-[12px] font-bold text-near-black">{p.patientName}</td>
                                    <td className="py-3 px-4">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                        p.visitType === 'home' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        {p.visitType === 'home' ? t('historyTable.includedCases.visitType.home') : t('historyTable.includedCases.visitType.practice')}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-[12px] text-gray-500 truncate max-w-[200px]" title={p.tests}>{p.tests}</td>
                                    <td className="py-3 px-4 text-[12px] font-bold text-near-black text-right">€{p.subtotal.toFixed(2)}</td>
                                  </tr>
                                ))}
                                {inv.payments.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="py-4 px-4 text-center text-gray-500 text-[12px]">{t('historyTable.includedCases.empty')}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                         </div>
                      </td>
                   </tr>
                 )}
               </React.Fragment>
            )) : (
               <tr>
                  <td colSpan={11} className="py-10 text-center text-gray-500 text-[14px]">{t('historyTable.empty')}</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-card-list p-4 bg-slate-50 border-t border-gray-200">
        {invoices.length > 0 ? invoices.map((inv) => (
          <div key={inv.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-3">
             <div className="flex items-center justify-between mb-2">
                <div>
                   <div className="font-bold text-[14px] text-near-black flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      {inv.invoice_number}
                   </div>
                   <div className="text-[12px] text-gray-500 font-medium mt-1">
                      {new Date(inv.period_start).toLocaleDateString()} &mdash; {new Date(inv.period_end).toLocaleDateString()}
                   </div>
                </div>
                <StatusBadge status={inv.status} />
             </div>
             <div className="flex items-center justify-between mt-3 text-[13px] text-near-black font-medium border-t border-gray-100 pt-3">
                <span>{t('historyTable.caseCount', { count: inv.case_count })}</span>
                <span className="font-bold text-[14px]">€{inv.total.toFixed(2)}</span>
             </div>
             <div className="mt-3">
                <Button variant="secondary" className="w-full h-8 px-3 text-[12px] flex items-center justify-center gap-2">
                   <Download className="w-3.5 h-3.5" /> {t('historyTable.buttons.downloadPdf')}
                </Button>
             </div>
          </div>
        )) : (
          <div className="text-center py-6 text-gray-500 text-[13px]">
             {t('historyTable.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
