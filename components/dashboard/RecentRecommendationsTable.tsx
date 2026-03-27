"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function RecentCasesTable({ recommendations }: { recommendations: any[] }) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden">
      <div className="pt-5 px-6 pb-4 flex justify-between items-center border-b border-gray-200">
        <h2 className="font-heading text-lg font-medium m-0 text-near-black">Recent Recommendations</h2>
        <a href="/dashboard/recommendations" className="text-[14px] text-primary-dark font-semibold hover:text-primary-dark transition-colors">
          View All &rarr;
        </a>
      </div>

      <div className="pt-3 pb-2 overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-200">
              {['ID', 'Patient', 'Status', 'Tests Count', 'Total', 'Date'].map((h, index) => (
                <th key={index} className="bg-gray-50 px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recommendations.map((c, i) => (
              <tr 
                key={i} 
                onClick={() => router.push(`/dashboard/recommendations/${c.id}`)}
                className={`group cursor-pointer transition-colors hover:bg-[#008085]/[0.02] ${i < recommendations.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                <td className="px-6 py-4 font-mono text-[13px] text-gray-500">{c.display_id || c.id}</td>
                <td className="px-6 py-4 font-semibold text-[14px] text-near-black">{c.patientName}</td>
                <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                <td className="px-6 py-4 font-body text-[14px] font-normal text-gray-500">{c.testsCount}</td>
                <td className="px-6 py-4 font-body text-[14px] font-normal text-gray-500">€{c.total.toFixed(2)}</td>
                <td className="px-6 py-4 font-body text-[14px] font-normal text-gray-500">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {recommendations.length === 0 && (
          <div className="p-10 text-center text-[14px] text-gray-500">
            No recommendations yet. Create your first recommendation.
          </div>
        )}
      </div>
    </div>
  );
}
