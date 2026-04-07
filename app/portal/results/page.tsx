"use client";
import { FileText } from 'lucide-react';
export default function PortalResultsPage() {
  return (
    <div>
      <h1 className="font-heading font-medium text-[24px] text-near-black tracking-tight mb-1" style={{ textTransform: 'none' }}>Results</h1>
      <p className="text-gray-500 text-[14px] mb-8">Your lab test results history.</p>
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-12 text-center">
        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-[14px]">Results will appear here when available.</p>
      </div>
    </div>
  );
}
