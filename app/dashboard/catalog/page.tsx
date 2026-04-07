"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Star, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';
import { Toast } from '@/components/shared/Toast';

export default function DoctorCatalogPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [laboratories, setLaboratories] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [labId, setLabId] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch labs for filter
  useEffect(() => {
    fetch('/api/doctor/catalog/laboratories')
      .then(r => r.json())
      .then(data => setLaboratories(data))
      .catch(() => {});
  }, []);

  // Fetch favorites
  useEffect(() => {
    fetch('/api/doctor/favorites')
      .then(r => r.json())
      .then(data => {
        const favIds = new Set<string>((data || []).map((f: any) => f.test_id));
        setFavorites(favIds);
      })
      .catch(() => {});
  }, []);

  // Fetch tests
  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (type !== 'all') params.append('type', type);
      if (labId !== 'all') params.append('lab_id', labId);
      if (showFavoritesOnly) params.append('favorites_only', 'true');

      const res = await fetch(`/api/doctor/catalog?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tests');
      const data = await res.json();
      setTests(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, labId, showFavoritesOnly]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Toggle favorite
  const toggleFavorite = async (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favorites.has(testId);
    try {
      const res = await fetch(`/api/doctor/favorites/${testId}`, {
        method: isFav ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error('Failed to update favorite');
      const newFavs = new Set(favorites);
      if (isFav) {
        newFavs.delete(testId);
        setToastMessage('Removed from favorites');
      } else {
        newFavs.add(testId);
        setToastMessage('Added to favorites');
      }
      setFavorites(newFavs);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* Header */}
      <div>
        <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
          Test Catalog
        </h1>
        <p className="text-gray-500 text-[14px] mt-1">
          Browse available tests and manage your favorites
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 h-11 rounded-full border border-gray-200 focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none transition-colors text-[14px] placeholder:text-gray-400"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Type filter */}
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="h-11 px-4 pr-10 text-[14px] rounded-full border border-gray-200 outline-none w-full md:w-40 bg-white
            appearance-none cursor-pointer text-[#1A1D23]
            bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236E7280%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]
            bg-[length:12px] bg-[right_14px_center] bg-no-repeat
            focus:border-[#008085] focus:ring-1 focus:ring-[#008085]"
        >
          <option value="all">All Types</option>
          <option value="parameter">Parameters</option>
          <option value="profile">Profiles</option>
        </select>

        {/* Lab filter */}
        <select
          value={labId}
          onChange={(e) => { setLabId(e.target.value); setPage(1); }}
          className="h-11 px-4 pr-10 text-[14px] rounded-full border border-gray-200 outline-none w-full md:w-48 bg-white
            appearance-none cursor-pointer text-[#1A1D23]
            bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236E7280%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]
            bg-[length:12px] bg-[right_14px_center] bg-no-repeat
            focus:border-[#008085] focus:ring-1 focus:ring-[#008085]"
        >
          <option value="all">All Laboratories</option>
          {laboratories.map((l: any) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        {/* Favorites toggle */}
        <button
          onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setPage(1); }}
          className={`h-11 px-5 rounded-full text-[13px] font-semibold transition-colors shrink-0 flex items-center gap-2
            border border-gray-200 hover:border-gray-300 ${
            showFavoritesOnly
              ? 'text-[#1A1D23] border-gray-300'
              : 'text-gray-500'
          }`}
        >
          <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
          Favorites
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[12px] text-gray-500 font-medium uppercase tracking-wide border-b border-gray-200">
              <tr>
                <th className="pl-5 pr-2 py-3.5 w-12"></th>
                <th className="px-3 py-3.5 w-[40%]">Test Name</th>
                <th className="px-3 py-3.5 w-28">Type</th>
                <th className="px-3 py-3.5 w-52">Laboratory</th>
                <th className="px-3 py-3.5 w-36 text-right">Price</th>
                <th className="pl-2 pr-5 py-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tests.map((test) => {
                const isFav = favorites.has(test.id);
                const isExpanded = expandedRow === test.id;

                return (
                  <React.Fragment key={test.id}>
                    {/* Main row */}
                    <tr
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : test.id)}
                    >
                      {/* Favorite star */}
                      <td className="pl-5 pr-2 py-4">
                        <button
                          onClick={(e) => toggleFavorite(test.id, e)}
                          className="text-gray-300 hover:text-amber-400 transition-colors"
                        >
                          <Star className={`w-5 h-5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Name + SKU */}
                      <td className="px-3 py-4 max-w-[400px]">
                        <p className="text-[14px] font-medium text-[#1A1D23] truncate">{test.name}</p>
                        <p className="text-[12px] font-mono text-gray-400 mt-0.5">{test.sku}</p>
                      </td>

                      {/* Type badge */}
                      <td className="px-3 py-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide ${
                          test.type === 'profile'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-[#E6F7F5] text-[#008085]'
                        }`}>
                          {test.type}
                        </span>
                      </td>

                      {/* Laboratory */}
                      <td className="px-3 py-4 text-[14px] text-[#6E7280]">
                        {test.laboratory?.name || test.lab?.name || '—'}
                      </td>

                      {/* Price */}
                      <td className="px-3 py-4 text-right">
                        {test.price_uninsured ? (
                          <span className="text-sm font-mono text-[#6E7280]">from €{Number(test.price_uninsured).toFixed(2)}</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>

                      {/* Expand icon */}
                      <td className="pl-2 pr-5 py-4 text-right">
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-gray-400 inline" />
                          : <ChevronDown className="w-4 h-4 text-gray-400 inline" />
                        }
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-5 py-0 bg-[#FAFAF9]">
                          <div className="py-5 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">

                            {/* Pricing card */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#008085] mb-3">Pricing</p>
                              <div className="space-y-2">
                                {test.price_insured != null && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#6E7280]">Privately insured</span>
                                    <span className="font-mono text-[#1A1D23]">€{Number(test.price_insured).toFixed(2)}</span>
                                  </div>
                                )}
                                {test.price_uninsured != null && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#6E7280]">Self-payer</span>
                                    <span className="font-mono text-[#1A1D23]">€{Number(test.price_uninsured).toFixed(2)}</span>
                                  </div>
                                )}
                                {test.price_zone1 != null && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#6E7280]">Zone 1</span>
                                    <span className="font-mono text-[#1A1D23]">€{Number(test.price_zone1).toFixed(2)}</span>
                                  </div>
                                )}
                                {test.price_zone2 != null && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#6E7280]">Zone 2</span>
                                    <span className="font-mono text-[#1A1D23]">€{Number(test.price_zone2).toFixed(2)}</span>
                                  </div>
                                )}
                                {test.price_zone3 != null && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#6E7280]">Zone 3</span>
                                    <span className="font-mono text-[#1A1D23]">€{Number(test.price_zone3).toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Details card */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#008085] mb-3">Details</p>
                              <div className="space-y-2">
                                {test.category && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#6E7280]">Category</span>
                                    <span className="text-[#1A1D23]">{test.category}</span>
                                  </div>
                                )}
                                {test.sample_shipping && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#6E7280]">Shipping</span>
                                    <span className="text-[#1A1D23] capitalize">{test.sample_shipping}</span>
                                  </div>
                                )}
                                {test.goae_digit && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#6E7280]">GoÄ</span>
                                    <span className="font-mono text-[#1A1D23]">{test.goae_digit}</span>
                                  </div>
                                )}
                                {test.edv_code && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#6E7280]">EDV Code</span>
                                    <span className="font-mono text-[#1A1D23]">{test.edv_code}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Preanalytics card */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#008085] mb-3">Preanalytics</p>
                              {test.preanalytics ? (
                                <p className="text-sm text-[#6E7280] leading-relaxed">{test.preanalytics}</p>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No special instructions</p>
                              )}
                            </div>

                            {/* Materials card */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#008085] mb-3">Materials</p>
                              {test.materials && test.materials.length > 0 ? (
                                <div className="space-y-2">
                                  {test.materials.map((mat: any, i: number) => (
                                    <div key={i} className="flex justify-between text-sm">
                                      <span className="text-[#6E7280]">{mat.name || mat.material_code || mat}</span>
                                      {mat.quantity && <span className="font-mono text-[#1A1D23]">×{mat.quantity}</span>}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No materials specified</p>
                              )}
                            </div>

                            {/* Included parameters — full width, only for profiles */}
                            {test.type === 'profile' && test.included_parameters && test.included_parameters.length > 0 && (
                              <div className="md:col-span-3 bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#008085] mb-3">
                                  Included Parameters ({test.included_parameters.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {test.included_parameters.map((param: any, i: number) => (
                                    <span key={i} className="px-2.5 py-1 bg-[#E6F7F5] border border-[#B3E8E0] rounded text-xs text-[#005C5F] font-medium">
                                      {typeof param === 'string' ? param : param.name || param}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {tests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No tests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-gray-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded-full border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-500 hover:border-gray-300 hover:text-[#1A1D23] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-full border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-500 hover:border-gray-300 hover:text-[#1A1D23] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
