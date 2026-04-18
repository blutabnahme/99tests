"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Download, FileText, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PadExportPage() {
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [labId, setLabId] = useState('all');
  const [includeExported, setIncludeExported] = useState(false);
  const [laboratories, setLaboratories] = useState<any[]>([]);

  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const selectClasses = "h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white appearance-none";
  const selectStyle = { backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' };
  const inputClasses = "h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white";

  useEffect(() => {
    async function fetchLabs() {
      try {
        const res = await fetch('/api/admin/laboratories');
        if (res.ok) {
          const allLabs = await res.json();
          // Only show labs with PAD export enabled
          setLaboratories(allLabs.filter((l: any) => l.pad_config?.enabled === true));
        }
      } catch (e) {}
    }
    fetchLabs();

    // Default date range: current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setDateStart(firstDay.toISOString().substring(0, 10));
    setDateEnd(now.toISOString().substring(0, 10));
  }, []);

  const handleExport = async () => {
    if (!dateStart || !dateEnd) {
      setError('Please select both start and end dates.');
      return;
    }

    setExporting(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/admin/exports/pad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_start: dateStart,
          date_end: dateEnd,
          lab_id: labId !== 'all' ? labId : undefined,
          include_exported: includeExported,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Export failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
          PAD XML Export
        </h1>
        <p className="text-gray-500 text-[14px] mt-1">
          Generate PAD billing files (ADL v2.12) for laboratory invoicing. Only orders with status "Results Ready" or "Completed" are included.
        </p>
      </div>

      {/* Export Form */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
        <h2 className="font-heading font-medium text-[16px] text-near-black mb-5">Export Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">Start Date *</label>
            <input
              type="date"
              value={dateStart}
              onChange={e => setDateStart(e.target.value)}
              className={`${inputClasses} w-full`}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">End Date *</label>
            <input
              type="date"
              value={dateEnd}
              onChange={e => setDateEnd(e.target.value)}
              className={`${inputClasses} w-full`}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">Laboratory</label>
            <select
              value={labId}
              onChange={e => setLabId(e.target.value)}
              className={`${selectClasses} w-full`}
              style={selectStyle}
            >
              <option value="all">All PAD-enabled Laboratories</option>
              {laboratories.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 flex items-end">
            <label className="flex items-center gap-2 cursor-pointer text-[14px] font-medium text-gray-700 h-11">
              <input
                type="checkbox"
                checked={includeExported}
                onChange={e => setIncludeExported(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Include previously exported
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={exporting || !dateStart || !dateEnd}
            className="rounded-full"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
          {/* Success header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-green-50/50 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <h3 className="font-heading font-medium text-[15px] text-near-black">
                Export Complete
              </h3>
              <p className="text-[13px] text-gray-600">
                {result.total_orders} order{result.total_orders !== 1 ? 's' : ''} exported across {result.total_files} file{result.total_files !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* File list */}
          <div className="p-6 space-y-3">
            {result.files?.map((file: any, i: number) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-[12px] border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-near-black">{file.lab_name}</div>
                  <div className="text-[12px] text-gray-500">
                    {file.order_count} order{file.order_count !== 1 ? 's' : ''} · {file.file_path.split('/').pop()}
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-400 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-[16px] p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-[13px] text-blue-800 space-y-1">
            <p className="font-medium">How PAD Export Works</p>
            <p>Orders are grouped by laboratory. One XML file is generated per lab containing all eligible orders in the selected date range. Orders are marked as "exported" after generation — use the checkbox to re-export if needed.</p>
            <p>File naming follows the pattern: <span className="font-mono text-[12px]">PV345000_YYYYMMDD_LabName_N_padx.xml</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
