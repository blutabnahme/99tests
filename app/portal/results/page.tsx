'use client';

import { useState, useEffect } from 'react';
import { usePatient } from '@/lib/patient-context';
import { FileText, Download, ChevronDown, ChevronRight, FlaskConical, Search, ArrowUpDown } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/format-date';

export default function PortalResultsPage() {
  const { patient } = usePatient();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'partial'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch('/api/portal/results');
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          // Auto-expand orders that have results
          const orderIds = new Set<string>();
          (data.results || []).forEach((r: any) => {
            if (r.order_id) orderIds.add(r.order_id);
          });
          setExpandedOrders(orderIds);
        }
      } catch {}
      finally { setLoading(false); }
    }
    fetchResults();
  }, []);

  const handleDownload = async (resultId: string) => {
    try {
      const res = await fetch(`/api/portal/results/${resultId}/download`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      window.open(data.url, '_blank');
    } catch (err: any) {
      alert('Download error: ' + err.message);
    }
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  // Filter results
  const filteredResults = results.filter((r: any) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchOrder = r.order?.display_id?.toLowerCase().includes(q);
      const matchTest = (r.tests_covered || []).some((t: any) =>
        (t.test_name || t.name || '').toLowerCase().includes(q)
      );
      const matchLab = r.laboratory?.name?.toLowerCase().includes(q);
      if (!matchOrder && !matchTest && !matchLab) return false;
    }
    return true;
  });

  // Group filtered results by order
  const resultsByOrder = filteredResults.reduce((acc: any, result: any) => {
    const orderId = result.order_id;
    if (!acc[orderId]) {
      acc[orderId] = { order: result.order, results: [] };
    }
    acc[orderId].results.push(result);
    return acc;
  }, {});

  // Apply status filter and sort
  let orderEntries = Object.entries(resultsByOrder) as [string, any][];

  if (filterStatus !== 'all') {
    orderEntries = orderEntries.filter(([, group]: [string, any]) => {
      const order = group.order;
      const totalTests = order?.recommendation?.items?.length || 0;
      const coveredNames = new Set<string>();
      group.results.forEach((r: any) => {
        (r.tests_covered || []).forEach((t: any) => {
          if (t.test_name) coveredNames.add(t.test_name.toLowerCase());
        });
      });
      const isComplete = coveredNames.size >= totalTests && totalTests > 0;
      return filterStatus === 'complete' ? isComplete : !isComplete;
    });
  }

  // Sort
  orderEntries.sort(([, a]: [string, any], [, b]: [string, any]) => {
    const dateA = new Date(a.results[0]?.created_at || 0).getTime();
    const dateB = new Date(b.results[0]?.created_at || 0).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-heading font-medium text-[28px] text-near-black mb-2">
        Your Results
      </h1>
      <p className="text-gray-500 text-[14px] mb-8">
        Lab test results shared by your doctor.
      </p>

      {results.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID or test name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-[14px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none bg-white transition-colors"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            {['all', 'complete', 'partial'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f as any)}
                className={`px-3.5 py-2 rounded-full text-[12px] font-medium transition-colors ${
                  filterStatus === f
                    ? 'bg-[#008085] text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {f === 'all' ? 'All' : f === 'complete' ? 'Complete' : 'Partial'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="px-3.5 py-2 rounded-full bg-white border border-gray-200 text-[12px] font-medium text-gray-500 hover:border-gray-300 transition-colors flex items-center gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
        </div>
      )}

      {results.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-12 text-center">
          <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">No results available yet.</p>
          <p className="text-gray-400 text-[13px] mt-1">
            When your lab results are ready, they'll appear here for download.
          </p>
        </div>
      ) : orderEntries.length === 0 && results.length > 0 ? (
        <div className="py-8 text-center">
          <p className="text-[14px] text-gray-400">No results match your search or filters.</p>
          <button
            onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
            className="text-[13px] text-[#008085] font-medium mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orderEntries.map(([orderId, group]: [string, any]) => {
            const order = group.order;
            const orderResults = group.results;
            const isExpanded = expandedOrders.has(orderId);

            // Calculate coverage by test name (reliable across ID mismatches)
            const coveredTestNames = new Set<string>();
            orderResults.forEach((r: any) => {
              (r.tests_covered || []).forEach((t: any) => {
                if (t.test_name) coveredTestNames.add(t.test_name.toLowerCase());
                if (t.name) coveredTestNames.add(t.name.toLowerCase());
              });
            });

            const allTests = (order?.recommendation?.items || []).map((item: any) => ({
              id: item.test?.id || item.id,
              name: item.test?.name || 'Unknown',
            }));

            const coveredCount = allTests.filter((t: any) => coveredTestNames.has(t.name.toLowerCase())).length;
            const pendingTests = allTests.filter((t: any) => !coveredTestNames.has(t.name.toLowerCase()));
            const totalTests = allTests.length;

            // Doctor info
            const doctorName = order?.doctor?.full_name || 'Your doctor';
            const practiceName = order?.doctor?.practice_name || '';
            const displayName = doctorName.replace(/^(Dr\.\s*med\.\s*|Prof\.\s*Dr\.\s*|Dr\.\s*)/i, '');

            return (
              <div key={orderId} className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
                {/* Order Header */}
                <button
                  onClick={() => toggleOrder(orderId)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <FlaskConical className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] text-[#008085] font-semibold">{order?.display_id || 'Order'}</span>
                        <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          coveredCount >= totalTests && totalTests > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {coveredCount >= totalTests && totalTests > 0 ? 'Complete' : 'Partial'}
                        </span>
                      </div>
                      <div className="text-[13px] text-gray-500 mt-0.5">
                        Dr. med. {displayName}{practiceName ? ` · ${practiceName}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <div className="text-[13px] font-medium text-gray-600">{coveredCount} of {totalTests} tests</div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-gray-100">
                    {/* Progress Bar */}
                    {totalTests > 0 && (
                      <div className="flex items-center gap-3 mt-4 mb-4">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#008085] rounded-full transition-all"
                            style={{ width: `${(coveredCount / totalTests) * 100}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-medium text-gray-500">{coveredCount}/{totalTests}</span>
                      </div>
                    )}

                    {/* Result Files */}
                    <div className="space-y-2">
                      {orderResults.map((result: any) => (
                        <div key={result.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-[12px]">
                          <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium text-near-black">
                              Lab Results — {(result.tests_covered || []).map((t: any) => t.test_name || t.name).join(', ') || 'Tests'}
                            </div>
                            <div className="text-[12px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                              {result.laboratory?.name || ''}
                              <span className="text-gray-300">·</span>
                              <span className="text-[12px] font-medium text-gray-500">{formatDate(result.created_at)}</span>
                            </div>
                            {result.doctor_notes && (
                              <div className="mt-2 p-3 bg-white rounded-[8px] border border-blue-100">
                                <div className="text-[11px] font-medium text-blue-500 uppercase tracking-wider mb-1">Doctor's Note</div>
                                <p className="text-[13px] text-gray-700">{result.doctor_notes}</p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDownload(result.id)}
                            className="px-4 py-2 rounded-full border border-[#008085] text-[#008085] hover:bg-[#008085]/5 text-[13px] font-medium transition-colors flex items-center gap-2 shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download PDF
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Pending Tests */}
                    {pendingTests.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Pending Results</div>
                        <div className="flex flex-wrap gap-2">
                          {pendingTests.map((t: any) => (
                            <span key={t.id} className="text-[12px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                              {t.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-[12px] text-gray-400 mt-2">
                          Results for these tests are still being processed by the laboratory.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
