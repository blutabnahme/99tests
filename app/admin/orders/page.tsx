"use client";

import React from 'react';

export default function OrdersPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
            Orders
          </h1>
          <p className="text-gray-500 text-[14px]">Manage patient orders and track their status.</p>
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-gray-200 p-16 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
        <h2 className="text-[28px] font-heading font-medium text-primary mb-2">Coming soon</h2>
        <p className="text-gray-500 text-[15px] max-w-md text-center">
          The order management interface is currently under construction and will be available in the next phase.
        </p>
      </div>
    </div>
  );
}
