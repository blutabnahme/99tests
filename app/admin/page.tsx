import Link from "next/link";
import { Users, Euro, FileText, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  return (
    <div className="flex-1 min-w-0 w-full mb-20 font-body">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-heading text-3xl font-medium text-near-black tracking-tight mb-2">Platform Overview</h1>
          <p className="text-[15px] sm:text-[16px] text-gray-500 leading-relaxed max-w-[500px]">
            High level summary of the 99Tests Lab Diagnostics system operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Euro className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-heading text-3xl font-semibold">€0.00</div>
            <div className="text-[13px] text-gray-500 mt-1">Total Revenue</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-heading text-3xl font-semibold">0</div>
            <div className="text-[13px] text-gray-500 mt-1">Total Orders</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-heading text-3xl font-semibold">0</div>
            <div className="text-[13px] text-gray-500 mt-1">Active Doctors</div>
          </div>
        </div>
      </div>

      <div className="py-16 text-center bg-white rounded-xl border border-gray-200 shadow-xs">
        <p className="text-primary font-medium">99Tests Coming soon</p>
      </div>

    </div>
  );
}
