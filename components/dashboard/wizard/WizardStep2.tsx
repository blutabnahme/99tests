"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Star, Minus, Plus, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Utility for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function WizardStep2({ 
  patient, 
  pricingTier, 
  cart, 
  setCart, 
  pricingPreview, 
  setPricingPreview, 
  onNext, 
  onBack,
  setDeliveryInfo // allows templates to prefill anamnese notes
}: any) {
  
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'presets' | 'templates' | 'lab'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  // const [selectedLab, setSelectedLab] = useState('all'); // skipping lab select dropdown for simplicity unless distinct labs are fed
  
  const [categories, setCategories] = useState<string[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});

  const columnMap: Record<string, string> = {
    'insured': 'price_insured',
    'uninsured': 'price_uninsured',
    'zone1': 'price_zone1',
    'zone2': 'price_zone2',
    'zone3': 'price_zone3'
  };
  const priceCol = columnMap[pricingTier] || 'price_insured';

  // 1. Fetch References on Mount
  useEffect(() => {
    fetch('/api/doctor/catalog/categories').then(r => r.json()).then(setCategories).catch(()=>{});
    fetch('/api/doctor/favorites').then(r => r.json()).then(setFavorites).catch(()=>{});
    fetch('/api/doctor/presets').then(r => r.json()).then(setPresets).catch(()=>{});
    fetch('/api/doctor/templates').then(r => r.json()).then(setTemplates).catch(()=>{});
  }, []);

  // 2. Fetch Catalog conditionally based on Tab & Filters
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (activeTab !== 'all' && activeTab !== 'favorites' && activeTab !== 'lab') {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchCatalog = async () => {
      setLoading(true);
      try {
        let url = `/api/doctor/catalog?search=${encodeURIComponent(debouncedSearch)}&limit=100`;
        if (selectedCategory !== 'all') url += `&category=${encodeURIComponent(selectedCategory)}`;
        
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        
        if (data.data) {
          if (activeTab === 'favorites') {
            setTests(data.data.filter((t: any) => favorites.includes(t.id)));
          } else {
            setTests(data.data);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    };

    fetchCatalog();

    return () => {
      if (abortControllerRef.current === controller) {
         controller.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch, selectedCategory]);

  // 3. Live Pricing Calculator Effect
  const stringifiedCart = JSON.stringify(cart);
  useEffect(() => {
    const calculatePricing = async () => {
      if (!patient || cart.length === 0) {
        setPricingPreview(null);
        return;
      }
      setCartLoading(true);
      try {
        const res = await fetch('/api/doctor/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             patient_id: patient.id,
             items: cart.map((i: any) => ({ test_id: i.test_id, quantity: i.quantity }))
          })
        });
        const data = await res.json();
        if (data.total) setPricingPreview(data);
      } catch (err) {
        console.error(err);
      } finally {
        setCartLoading(false);
      }
    };

    const timer = setTimeout(calculatePricing, 500);
    return () => clearTimeout(timer);
  }, [stringifiedCart, patient, setPricingPreview]);

  // 4. Cart Mutations
  const addToCart = (test: any) => {
    setCart((prev: any[]) => {
      const existing = prev.find(i => i.test_id === test.id);
      if (existing) return prev;
      return [...prev, { 
        test_id: test.id, 
        name: test.name, 
        sku: test.sku, 
        type: test.type, 
        quantity: 1, 
        unit_price: test[priceCol] ? Number(test[priceCol]) : 0 
      }];
    });
  };

  const removeFromCart = (test_id: string) => {
    setCart((prev: any[]) => prev.filter(i => i.test_id !== test_id));
  };

  // 5. Favorites Toggle
  const toggleFavorite = async (e: React.MouseEvent, test_id: string) => {
    e.stopPropagation();
    const isFav = favorites.includes(test_id);
    setFavorites(prev => isFav ? prev.filter(id => id !== test_id) : [...prev, test_id]);

    try {
      await fetch('/api/doctor/favorites', {
        method: isFav ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id })
      });
    } catch(err) {
      console.error(err);
    }
  };

  // 6. Template & Preset Application
  const loadTestSet = async (testIds: string[], defaultNotes?: string) => {
    try {
      // Must fetch catalog entries resolving these IDs to append standard Cart metadata
      const res = await fetch(`/api/doctor/catalog?limit=500`);
      const { data } = await res.json();
      const resolvedTests = (data || []).filter((t: any) => testIds.includes(t.id));
      
      const newAdditions = resolvedTests.map((t: any) => ({
        test_id: t.id, 
        name: t.name, 
        sku: t.sku, 
        type: t.type, 
        quantity: 1, 
        unit_price: t[priceCol] ? Number(t[priceCol]) : 0
      }));

      // Naive merge resolving duplicates via overwrite or additive quantity
      setCart((prev: any[]) => {
        const map = new Map(prev.map(i => [i.test_id, i]));
        newAdditions.forEach((na: any) => {
          if (!map.has(na.test_id)) map.set(na.test_id, na);
        });
        return Array.from(map.values());
      });

      if (defaultNotes && setDeliveryInfo) {
        setDeliveryInfo((prev: any) => ({ ...prev, anamnese: prev.anamnese ? `${prev.anamnese}\n${defaultNotes}` : defaultNotes }));
      }
    } catch(err) {
      console.error(err);
    }
  };


  return (
    <div className="w-full mx-auto font-body flex flex-col md:flex-row gap-6 relative">
      
      {/* LEFT PANEL: BROWSER */}
      <div className="w-full md:w-[60%] flex flex-col gap-6">
        
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 z-10 sticky top-4">
          <h2 className="font-heading text-[24px] font-medium text-near-black mb-6">Select Tests</h2>
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="Search tests by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-10 text-[13px] bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-primary transition-all placeholder:text-gray-400"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            {loading && <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-4 top-1/2 -translate-y-1/2" />}
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {[
              { id: 'all', label: 'All Catalog' },
              { id: 'favorites', label: '★ My Favorites' },
              { id: 'presets', label: '📋 My Presets' },
              { id: 'templates', label: '📄 My Templates' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors border ${activeTab === tab.id ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(activeTab === 'all' || activeTab === 'favorites') && categories.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar">
               <select 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="h-9 px-3 text-[12px] rounded-[8px] bg-gray-50 border border-gray-200 outline-none pr-8 cursor-pointer font-medium text-gray-700"
               >
                 <option value="all">All Categories</option>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
          )}
        </div>

        {/* LIST RENDERING */}
        <div className="flex-1 space-y-3 pb-8">
          
          {(activeTab === 'all' || activeTab === 'favorites') && (
            <div className="relative">
              {tests.length === 0 && loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
              ) : tests.length === 0 && !loading ? (
                <div className="text-center py-10 text-gray-400 text-[13px]">No tests found in {activeTab === 'favorites' ? 'Favorites' : 'Catalog'}.</div>
              ) : (
                <div className="space-y-3">
                  {tests.map(test => (
                    <div key={test.id} className="bg-white rounded-[16px] border border-gray-100 p-4 transition-all shadow-sm hover:shadow-md">
                      <div className="flex items-start justify-between">
                        
                        <div className="flex gap-3">
                          <button onClick={(e) => toggleFavorite(e, test.id)} className="shrink-0 mt-0.5" title="Toggle Favorite">
                             <Star className={`w-5 h-5 transition-colors ${favorites.includes(test.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`} />
                          </button>
                          
                          <div>
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandedTests(p => ({...p, [test.id]: !p[test.id]}))}>
                              <span className="font-semibold text-near-black text-[14px]">{test.name}</span>
                              <span className="text-[11px] font-mono text-gray-400">({test.sku})</span>
                              <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${test.type === 'profile' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                                {test.type}
                              </span>
                              {expandedTests[test.id] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            </div>
                            <div className="text-[12px] text-gray-500 mt-1">{test.lab?.name || 'Local Catalog'}</div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-4">
                           <span className="text-[14px] font-bold text-near-black whitespace-nowrap">
                             €{Number(test[priceCol] || 0).toFixed(2)}
                           </span>
                           {cart.some((i: any) => i.test_id === test.id) ? (
                             <Button variant="secondary" disabled className="rounded-full px-4 h-8 text-[12px] bg-gray-50 text-gray-400 border border-gray-100">
                               Added ✓
                             </Button>
                           ) : (
                             <Button 
                               variant="primary" 
                               className="rounded-full px-4 h-8 text-[12px]" 
                               onClick={() => addToCart(test)}
                             >
                               Add
                             </Button>
                           )}
                        </div>

                      </div>

                      {expandedTests[test.id] && (
                         <div className="mt-4 ml-8 bg-gray-50 rounded-[12px] border border-gray-100 overflow-hidden divide-y divide-gray-200/60">
                            
                            {test.category && (
                              <div className="flex items-start gap-4 p-3.5">
                                <span className="text-[12px] font-semibold text-gray-500 w-28 shrink-0 mt-0.5">Category</span>
                                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase">{test.category}</span>
                              </div>
                            )}

                            {test.lab?.name && (
                              <div className="flex items-start gap-4 p-3.5">
                                <span className="text-[12px] font-semibold text-gray-500 w-28 shrink-0">Laboratory</span>
                                <span className="text-[13px] text-near-black font-medium">{test.lab.name}</span>
                              </div>
                            )}

                            {test.materials && test.materials.length > 0 && (
                              <div className="flex items-start gap-4 p-3.5">
                                <span className="text-[12px] font-semibold text-gray-500 w-28 shrink-0">Materials Requ.</span>
                                <ul className="text-[13px] text-near-black space-y-1">
                                  {test.materials.map((m: any, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="mt-1.5 w-1 h-1 bg-gray-400 rounded-full shrink-0"></span>
                                      <span>{m.name} {m.volume && <span className="text-gray-500">— {m.volume}</span>}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {test.type === 'profile' && test.included_parameters && test.included_parameters.length > 0 && (
                              <div className="flex items-start gap-4 p-3.5">
                                <span className="text-[12px] font-semibold text-gray-500 w-28 shrink-0">Parameters</span>
                                <div className="text-[13px] text-near-black leading-relaxed">
                                  {test.included_parameters.map((id: string) => tests.find((t: any) => t.id === id)?.name).filter(Boolean).join(', ') || <span className="text-gray-400 italic">Details loading...</span>}
                                </div>
                              </div>
                            )}

                            {test.preanalytics && (
                              <div className="p-3.5">
                                <div className="bg-blue-50 border border-blue-100/60 rounded-[8px] p-3">
                                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">Patient Preparation</div>
                                  <div className="text-[13px] text-blue-900 leading-relaxed">{test.preanalytics}</div>
                                </div>
                              </div>
                            )}

                            {test.more_info_url && (
                              <div className="p-3.5 bg-white/50">
                                <a href={test.more_info_url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary hover:underline font-medium inline-flex items-center gap-1 transition-colors">
                                  More information <ChevronRight className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                         </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 gap-3">
              {[1,2,3,4,5].map(slot => {
                const p = presets.find((pr: any) => pr.slot_number === slot);
                return (
                  <div key={slot} className="bg-white rounded-[16px] p-5 border border-gray-100 flex items-center justify-between">
                    <div>
                       <div className="flex items-center gap-2">
                         <span className="text-[14px] font-bold text-gray-300">#{slot}</span>
                         <span className="text-[15px] font-semibold text-near-black">{p ? p.name : 'Empty Slot'}</span>
                       </div>
                       {p && <div className="text-[13px] text-gray-500 mt-1">{p.test_ids.length} tests configured</div>}
                    </div>
                    {p ? (
                      <Button onClick={() => loadTestSet(p.test_ids)} className="rounded-full px-5 h-9 text-[13px]">Load Preset</Button>
                    ) : (
                      <span className="text-[12px] text-gray-400 italic">Configure in Settings</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'templates' && (
             <div className="space-y-3">
               {templates.map((t: any) => (
                 <div key={t.id} className="bg-white rounded-[16px] p-5 border border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-[15px] font-semibold text-near-black">{t.name}</h4>
                      {t.description && <p className="text-[13px] text-gray-500 mt-1">{t.description}</p>}
                      <div className="text-[12px] text-primary font-medium mt-2">{t.test_ids.length} items included</div>
                    </div>
                    <Button onClick={() => loadTestSet(t.test_ids, t.default_notes)} className="rounded-full px-5 h-9 text-[13px] shrink-0">Use Template</Button>
                 </div>
               ))}
               {templates.length === 0 && (
                 <div className="text-center py-10 text-gray-400 text-[13px]">No templates found. Create them here or in Settings!</div>
               )}
             </div>
          )}

        </div>
      </div>

      {/* RIGHT PANEL: SELECTION SIDEBAR */}
      <div className="w-full md:w-[40%] sticky top-6 self-start flex flex-col">
        <div className={`bg-white rounded-xl shadow-md overflow-hidden mb-4 flex flex-col transition-all duration-300 ${cart.length === 0 ? 'h-auto pb-6' : 'max-h-[calc(100vh-120px)] overflow-y-auto'}`}>
          
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
             <div className="flex items-center gap-2">
                <h3 className="font-heading text-[18px] font-medium text-near-black">Selected Tests</h3>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[12px] font-bold">{cart.length}</span>
             </div>
             {cart.length > 0 && (
               <button onClick={() => setCart([])} className="text-[13px] text-red-500 hover:text-red-700 font-medium">Remove All</button>
             )}
          </div>

          {cart.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-white rounded-b-xl">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Search className="w-6 h-6 text-gray-300" /></div>
               <p className="text-[14px]">No tests selected</p>
               <p className="text-[12px] mt-1">Browse the catalog and add tests to your recommendation.</p>
             </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
                 {cart.map((item: any) => (
                   <div key={item.test_id} className="bg-white px-4 py-3 rounded-[12px] border border-gray-100 shadow-sm flex items-center justify-between">
                     <div className="text-[13px] text-near-black font-medium truncate">{item.name}</div>
                     <div className="flex items-center gap-3 shrink-0 ml-4">
                       <span className="font-bold text-[13px] text-near-black">€{Number(item.unit_price).toFixed(2)}</span>
                       <button onClick={() => removeFromCart(item.test_id)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-full transition-colors"><Trash2 className="w-4 h-4"/></button>
                     </div>
                   </div>
                 ))}
              </div>
              <div className="px-6 pt-6 pb-5 bg-white border-t border-gray-100 shrink-0 mt-auto">
                 {pricingPreview ? (
                   <div className="space-y-2 font-mono text-[13px]">
                     <div className="flex justify-between text-gray-600">
                       <span>Test costs</span>
                       <span>€{pricingPreview.test_costs_total.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-gray-600">
                       <span>Service fee ({pricingPreview.service_fee_pct}%)</span>
                       <span>€{pricingPreview.service_fee.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-gray-600">
                       <span>Shipping</span>
                       <span>€{pricingPreview.shipping_estimate.toFixed(2)}</span>
                     </div>
                     <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-700">
                       <span>Subtotal</span>
                       <span>€{(pricingPreview.test_costs_total + pricingPreview.service_fee + pricingPreview.shipping_estimate).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-gray-500 text-[12px]">
                       <span>VAT (19%)</span>
                       <span>€{pricingPreview.vat.toFixed(2)}</span>
                     </div>
                     <div className="border-t border-gray-100 mt-2 pt-4 flex justify-between font-bold text-[16px] text-[#008085]">
                       <span>TOTAL</span>
                       <span>€{pricingPreview.total.toFixed(2)}</span>
                     </div>
                   </div>
                 ) : (
                    <div className="text-center text-[12px] text-gray-400 italic min-h-[140px] flex items-center justify-center">
                      {cartLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-300" /> : 'Awaiting items for calculation...'}
                    </div>
                 )}
              </div>
            </>
          )}

        </div>
        
        {/* Buttons rendered outside the sticky card */}
        <div className="mt-4 shrink-0">
           <div className="flex items-center gap-3">
             <Button variant="secondary" onClick={onBack} className="rounded-full px-6 h-12 text-[14px]">Back</Button>
             <Button variant="primary" onClick={onNext} disabled={cart.length === 0} className="w-full rounded-full h-12 text-[15px] font-semibold">
               Proceed to Collection
             </Button>
           </div>
        </div>

      </div>
    
    </div>
  );
}
