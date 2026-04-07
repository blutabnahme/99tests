"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

interface Column<T> {
 key: string;
 header: string;
 render: (item: T) => React.ReactNode;
 isPrimary?: boolean;
 hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
 data: T[];
 columns: Column<T>[];
 getKey: (item: T) => string;
 onRowClick?: (item: T) => void;
 renderMobileCard?: (item: T) => React.ReactNode;
 emptyMessage?: string;
}

export default function ResponsiveTable<T>({
 data, columns, getKey, onRowClick, renderMobileCard, emptyMessage,
}: ResponsiveTableProps<T>) {
 const t = useTranslations();
 if (data.length === 0) {
 return (
 <div className="text-center py-12 text-gray-400 text-[14px] font-body">
 {emptyMessage || t("ui.table.noData")}
 </div>
 );
 }

 return (
 <>
 <div className="responsive-table-wrapper">
 <table className="w-full">
 <thead>
 <tr className="border-b border-gray-100">
 {columns.map((col) => (
 <th key={col.key} className="text-left px-4 py-3 text-[12px] font-semibold text-gray-500 bg-gray-50 font-body">
 {col.header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {data.map((item) => (
 <tr
 key={getKey(item)}
 className={`border-b border-gray-50 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
 onClick={() => onRowClick?.(item)}
 >
 {columns.map((col) => (
 <td key={col.key} className="px-4 py-3 text-[14px] text-gray-700 font-body">
 {col.render(item)}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="mobile-card-list">
 {data.map((item) => {
 if (renderMobileCard) {
 return <div key={getKey(item)} onClick={() => onRowClick?.(item)}>{renderMobileCard(item)}</div>;
 }

 const primaryCol = columns.find((c) => c.isPrimary) || columns[0];
 const secondaryCols = columns.filter((c) => c !== primaryCol && !c.hideOnMobile);

 return (
 <div
 key={getKey(item)}
 className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''} transition-colors`}
 onClick={() => onRowClick?.(item)}
 >
 <div className="mb-2 text-[14px] font-medium text-near-black font-body">
 {primaryCol.render(item)}
 </div>
 <div className="grid grid-cols-2 gap-x-4 gap-y-2">
 {secondaryCols.map((col) => (
 <div key={col.key}>
 <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5 font-body">{col.header}</div>
 <div className="text-[13px] text-gray-700 font-body">{col.render(item)}</div>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 </>
 );
}
