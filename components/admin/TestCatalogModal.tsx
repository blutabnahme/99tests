"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Plus, Trash2, ChevronDown, ChevronRight, Search, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TubeColorDot } from '@/components/admin/TubeColorDot';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string; code: string; tube_color?: string; default_volume?: number | null; default_unit?: string }[];
  placeholder?: string;
}

function SearchableSelect({ value, onChange, options, placeholder = "Select Material" }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(search.toLowerCase()) || 
    opt.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOpt = options.find(o => o.id === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left text-[13px] h-11 px-4 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none flex items-center justify-between font-medium transition-colors bg-white ${selectedOpt ? 'text-gray-900' : 'text-gray-400'}`}
      >
        <span className="truncate">{selectedOpt ? `${selectedOpt.name} (${selectedOpt.code})` : placeholder}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-60 flex flex-col z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100 shrink-0 bg-white">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full text-[13px] border-b border-gray-200 px-3 py-2 outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-400"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1 max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-gray-500 text-center italic">No results found</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-900 transition-colors flex items-center gap-2 ${value === opt.id ? 'bg-primary/5 text-primary font-medium' : ''}`}
                >
                  {opt.tube_color && <TubeColorDot color={opt.tube_color} />}
                  <span className="truncate font-medium">{opt.name}</span>
                  <span className="text-gray-400 font-mono text-[12px] shrink-0">({opt.code})</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TestCatalogModalProps {
  test?: any;
  categories: string[];
  laboratories: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const TABS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'logistics', label: 'Materials & Logistics' },
  { id: 'billing', label: 'Billing (GoÄ)' },
  { id: 'profile', label: 'Profile Config' }
];

export default function TestCatalogModal({ test, categories, laboratories, onClose, onSuccess }: TestCatalogModalProps) {
  const isEditing = !!test;
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    type: 'parameter',
    category: '',
    lab_id: '',
    is_active: true,
    
    lab_cost: '',
    price_insured: '',
    price_uninsured: '',
    price_zone1: '',
    price_zone2: '',
    price_zone3: '',
    
    sample_shipping: 'standard',
    preanalytics: '',
    more_info_url: '',
    
    edv_code: '',
    goae_digit: '',
    goae_costs: '',
    goae_names: '',
    goae_factor: '',
  });

  const [nameTranslations, setNameTranslations] = useState({
    DE: '', EN: '', ES: '', NL: '', FR: ''
  });
  const [showTranslations, setShowTranslations] = useState(false);

  const [materials, setMaterials] = useState<any[]>([]);
  const [catalogMaterials, setCatalogMaterials] = useState<any[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [includedParams, setIncludedParams] = useState<any[]>([]); // array of objects {id, sku, name}

  useEffect(() => {
    async function fetchCatMats() {
      try {
        const res = await fetch('/api/admin/materials?active_only=true');
        if (res.ok) setCatalogMaterials(await res.json());
      } catch (e) {}
    }
    fetchCatMats();
  }, []);
  
  // For searching parameters
  const [paramSearch, setParamSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingParams, setSearchingParams] = useState(false);

  useEffect(() => {
    if (test) {
      setFormData({
        sku: test.sku || '',
        name: test.name || '',
        type: test.type || 'parameter',
        category: test.category || '',
        lab_id: test.lab_id || '',
        is_active: test.is_active ?? true,
        
        lab_cost: test.lab_cost !== null ? String(test.lab_cost) : '',
        price_insured: test.price_insured !== null ? String(test.price_insured) : '',
        price_uninsured: test.price_uninsured !== null ? String(test.price_uninsured) : '',
        price_zone1: test.price_zone1 !== null ? String(test.price_zone1) : '',
        price_zone2: test.price_zone2 !== null ? String(test.price_zone2) : '',
        price_zone3: test.price_zone3 !== null ? String(test.price_zone3) : '',
        
        sample_shipping: test.sample_shipping || 'standard',
        preanalytics: test.preanalytics || '',
        more_info_url: test.more_info_url || '',
        
        edv_code: test.edv_code || '',
        goae_digit: test.goae_digit || '',
        goae_costs: test.goae_costs || '',
        goae_names: test.goae_names || '',
        goae_factor: test.goae_factor || '',
      });

      if (test.name_translations) {
        setNameTranslations({
          DE: test.name_translations.DE || '',
          EN: test.name_translations.EN || '',
          ES: test.name_translations.ES || '',
          NL: test.name_translations.NL || '',
          FR: test.name_translations.FR || '',
        });
      }

      if (Array.isArray(test.materials)) {
        setMaterials(test.materials);
      }
    }
  }, [test]);

  // Fetch included parameters details if profile
  useEffect(() => {
    async function fetchIncludedDetails() {
      if (test?.type === 'profile' && Array.isArray(test.included_parameters) && test.included_parameters.length > 0) {
        try {
          // just fetch from catalog using ID list (might not be exposed directly like this in GET / route, but we can search)
          // Since the API doesn't support an `in` filter query yet, we can fetch all and filter or make a specialized call.
          // To keep it clean, we'll fetch them individually or use the search endpoint for small lists.
          // For now, if we don't have a bulk fetch, we can just leave them as IDs but it's bad UX.
          // Actually, let's just use the search endpoint, it'll fetch 50 and we can filter.
          const res = await fetch('/api/admin/catalog?limit=1000&type=parameter');
          if (res.ok) {
            const data = await res.json();
            const included = data.data.filter((p: any) => test.included_parameters.includes(p.id));
            setIncludedParams(included.map((p: any) => ({ id: p.id, sku: p.sku, name: p.name })));
          }
        } catch (e) {}
      }
    }
    fetchIncludedDetails();
  }, [test]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleToggleActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, is_active: e.target.checked }));
  };

  const handleTranslationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameTranslations(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Materials methods
  const addEmptyMaterial = () => {
    setMaterials([...materials, { 
      material_id: '',
      material_code: '', 
      name: '', 
      volume: null,
      unit: 'ml', 
      qty: 1
    }]);
  };

  const handleMaterialSelect = (index: number, matId: string) => {
    const selected = catalogMaterials.find(m => m.id === matId);
    if (!selected) return;
    const newMats = [...materials];
    newMats[index] = {
      ...newMats[index],
      material_id: selected.id,
      material_code: selected.code,
      name: selected.name,
      tube_color: selected.tube_color,
      volume: selected.default_volume ?? null,
      unit: selected.default_unit || 'ml',
    };
    setMaterials(newMats);
  };

  const updateMaterial = (index: number, field: string, value: string | number | boolean) => {
    const newMats = [...materials];
    newMats[index] = { ...newMats[index], [field]: value };
    setMaterials(newMats);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  // Profile methods
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (paramSearch.trim().length > 1 && formData.type === 'profile') {
        setSearchingParams(true);
        try {
          const res = await fetch(`/api/admin/catalog?search=${encodeURIComponent(paramSearch)}&type=parameter&limit=10`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.data);
          }
        } catch (e) {} finally {
          setSearchingParams(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [paramSearch, formData.type]);

  const addIncludedParam = (param: any) => {
    if (!includedParams.find(p => p.id === param.id)) {
      setIncludedParams([...includedParams, { id: param.id, sku: param.sku, name: param.name }]);
    }
    setParamSearch('');
    setSearchResults([]);
  };

  const removeIncludedParam = (id: string) => {
    setIncludedParams(includedParams.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const parsedMaterials = materials.map(m => ({
      material_id: m.material_id || undefined,
      material_code: String(m.material_code || ''),
      name: String(m.name || ''),
      volume: m.volume ? parseFloat(String(m.volume)) : undefined,
      unit: m.unit ? String(m.unit) : undefined,
      qty: m.qty ? parseInt(String(m.qty)) : undefined,
    }));

    const payload: any = {
      ...formData,
      lab_id: formData.lab_id || null, // Ensure lab_id is null if empty
      materials: parsedMaterials,
      name_translations: nameTranslations
    };

    if (formData.type === 'profile') {
      payload.included_parameters = includedParams.map(p => p.id);
    }

    // Convert strings to nums where necessary
    const numericFields = ['lab_cost', 'price_insured', 'price_uninsured', 'price_zone1', 'price_zone2', 'price_zone3'];
    for (const f of numericFields) {
      if (payload[f] !== undefined) {
        if (payload[f] === '') payload[f] = null;
        else payload[f] = parseFloat(payload[f]);
      }
    }

    try {
      const url = isEditing ? `/api/admin/catalog/${test.id}` : `/api/admin/catalog`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save test');
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter out the profile tab if type is not profile
  const visibleTabs = formData.type === 'profile' ? TABS : TABS.filter(t => t.id !== 'profile');
  
  useEffect(() => {
    if (formData.type !== 'profile' && activeTab === 'profile') {
      setActiveTab('basic');
    }
  }, [formData.type, activeTab]);

  const filteredMaterials = catalogMaterials.filter(m => 
    !materials.some(existing => existing.material_id === m.id) &&
    (m.name.toLowerCase().includes(materialSearch.toLowerCase()) || 
     m.code.toLowerCase().includes(materialSearch.toLowerCase()))
  );

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0"
      style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[16px] shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="font-heading font-medium text-[20px] text-near-black">
              {isEditing ? `Edit ${test?.type === 'profile' ? 'Profile' : 'Parameter'}` : 'Add Test'}
            </h2>
            {isEditing && <div className="text-[13px] text-gray-500 font-mono mt-0.5">{test.sku}</div>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex overflow-x-auto border-b border-gray-200 px-6 bg-white sticky top-0 z-20">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-near-black'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 font-body">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-[12px] text-[14px] font-medium border border-red-100">
              {error}
            </div>
          )}

          <form id="test-form" onSubmit={handleSubmit}>
            
            {/* TAB: BASIC */}
            <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2 flex items-center gap-4 bg-gray-50 p-4 rounded-[12px] border border-gray-100">
                   <label className="flex items-center gap-2 cursor-pointer shrink-0 text-[14px] font-medium text-gray-700">
                    <input 
                      type="checkbox" 
                      name="is_active"
                      checked={formData.is_active} 
                      onChange={handleToggleActive}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Active in Catalog
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">SKU *</label>
                  <input required name="sku" value={formData.sku} onChange={handleChange} disabled={isEditing} className={`w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 ${isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} placeholder="e.g. TSH-001" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Type *</label>
                  <select name="type" required value={formData.type} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-no-repeat bg-[position:right_12px_center]">
                    <option value="parameter">Parameter</option>
                    <option value="profile">Profile</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[13px] font-medium text-gray-700">Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                </div>

                <div className="md:col-span-2 border border-gray-200 rounded-[12px] overflow-hidden bg-white">
                  <button type="button" onClick={() => setShowTranslations(!showTranslations)} className="w-full flex items-center justify-between p-3 px-4 bg-gray-50/20 hover:bg-gray-50 transition-colors text-left">
                    <span className="font-medium text-[13px] text-gray-700">Name Translations</span>
                    {showTranslations ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </button>
                  {showTranslations && (
                    <div className="p-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50/50">
                      {['DE', 'EN', 'ES', 'NL', 'FR'].map(lang => (
                        <div key={lang} className="flex items-center gap-2">
                          <span className="w-8 shrink-0 text-[12px] font-bold text-gray-500">{lang}</span>
                          <input name={lang} value={(nameTranslations as any)[lang]} onChange={handleTranslationChange} className="w-full h-9 px-3 text-[13px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Category</label>
                  <input name="category" list="category-options" value={formData.category} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" placeholder="Type or select..." />
                  <datalist id="category-options">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Laboratory</label>
                  <select name="lab_id" value={formData.lab_id} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-no-repeat bg-[position:right_12px_center]">
                    <option value="">-- No Laboratory --</option>
                    {laboratories.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* TAB: PRICING */}
            <div className={activeTab === 'pricing' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[13px] font-medium text-gray-700">Lab Cost (Lab charging us)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input type="number" step="0.01" name="lab_cost" value={formData.lab_cost} onChange={handleChange} className="w-full h-11 pl-8 pr-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                </div>
                
                <h3 className="md:col-span-2 text-[14px] font-bold text-near-black mt-2 mb-1 border-b border-gray-100 pb-2">Sales Prices</h3>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Price: Privately Insured</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input type="number" step="0.01" name="price_insured" value={formData.price_insured} onChange={handleChange} className="w-full h-11 pl-8 pr-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Price: Uninsured / Self-payer</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input type="number" step="0.01" name="price_uninsured" value={formData.price_uninsured} onChange={handleChange} className="w-full h-11 pl-8 pr-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Price: Foreign Zone 1</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input type="number" step="0.01" name="price_zone1" value={formData.price_zone1} onChange={handleChange} className="w-full h-11 pl-8 pr-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Price: Foreign Zone 2</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input type="number" step="0.01" name="price_zone2" value={formData.price_zone2} onChange={handleChange} className="w-full h-11 pl-8 pr-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Price: Foreign Zone 3</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input type="number" step="0.01" name="price_zone3" value={formData.price_zone3} onChange={handleChange} className="w-full h-11 pl-8 pr-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* TAB: LOGISTICS AND MATERIALS */}
            <div className={activeTab === 'logistics' ? 'block' : 'hidden'}>
              <div className="space-y-6">
                
                <div className="space-y-4">
                  <h3 className="text-[14px] font-bold text-near-black">Materials</h3>
                  
                  {materials.length === 0 ? (
                    <div className="text-[13px] text-gray-500 italic p-6 bg-gray-50 rounded-[12px] text-center border border-gray-100">
                      No materials added yet
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {materials.map((mat, i) => (
                        <div key={i} className="bg-gray-50 rounded-[12px] p-4 border border-gray-100 relative">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 w-full min-w-0">
                              <SearchableSelect
                                value={mat.material_id || ''}
                                onChange={val => handleMaterialSelect(i, val)}
                                options={catalogMaterials}
                                placeholder="Select Material"
                              />
                            </div>
                            <div className="flex items-center shrink-0 gap-2">
                              <div className="flex items-center gap-1 border border-gray-200 rounded-full bg-white h-11 px-1.5 shadow-sm">
                                <button type="button" onClick={() => updateMaterial(i, 'qty', Math.max(1, (mat.qty || 1) - 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-near-black rounded-full hover:bg-gray-50 transition-colors"><Minus className="w-4 h-4" /></button>
                                <span className="w-8 text-center text-[14px] font-medium text-near-black">{mat.qty || 1}</span>
                                <button type="button" onClick={() => updateMaterial(i, 'qty', (mat.qty || 1) + 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-near-black rounded-full hover:bg-gray-50 transition-colors"><Plus className="w-4 h-4" /></button>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => removeMaterial(i)} 
                                className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                                title="Remove Material"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    type="button" 
                    onClick={addEmptyMaterial} 
                    className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary-dark transition-colors mt-2"
                  >
                    + Add Material
                  </button>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[13px] font-medium text-gray-700">Sample Shipping *</label>
                    <select name="sample_shipping" value={formData.sample_shipping} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-no-repeat bg-[position:right_12px_center]">
                      <option value="standard">Standard</option>
                      <option value="prio">Prio</option>
                      <option value="express">Express</option>
                      <option value="gologistik">GoLogistik</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[13px] font-medium text-gray-700">Preanalytics (Patient Instructions)</label>
                    <textarea name="preanalytics" value={formData.preanalytics} onChange={handleChange} className="w-full min-h-[80px] p-4 text-[14px] rounded-[16px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>

                   <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[13px] font-medium text-gray-700">More Info URL</label>
                    <input type="url" name="more_info_url" value={formData.more_info_url} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" placeholder="https://" />
                  </div>
                </div>

              </div>
            </div>

            {/* TAB: BILLING */}
            <div className={activeTab === 'billing' ? 'block' : 'hidden'}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[13px] font-medium text-gray-700">EDV Code</label>
                    <input name="edv_code" value={formData.edv_code} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-700">GoÄ Digit(s)</label>
                    <input name="goae_digit" value={formData.goae_digit} onChange={handleChange} placeholder="e.g. 4288 (2x)" className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-700">GoÄ Factor</label>
                    <input name="goae_factor" value={formData.goae_factor} onChange={handleChange} placeholder="e.g. 1.15" className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[13px] font-medium text-gray-700">GoÄ Costs</label>
                    <input name="goae_costs" value={formData.goae_costs} onChange={handleChange} placeholder="e.g. 20.40 (2x)" className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[13px] font-medium text-gray-700">GoÄ Names (Description)</label>
                    <textarea name="goae_names" value={formData.goae_names} onChange={handleChange} className="w-full min-h-[80px] p-4 text-[14px] rounded-[16px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
                  </div>
               </div>
            </div>

            {/* TAB: PROFILE CONFIG */}
            {formData.type === 'profile' && (
              <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
                <div className="space-y-4">
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      value={paramSearch}
                      onChange={e => setParamSearch(e.target.value)}
                      placeholder="Search parameters by SKU or Name to include..."
                      className="w-full pl-10 pr-4 h-11 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[14px]"
                    />
                    {searchingParams && <div className="absolute inset-y-0 right-4 flex items-center"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>}
                    
                    {searchResults.length > 0 && (
                      <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 shadow-lg rounded-[12px] z-10 max-h-60 overflow-y-auto">
                        {searchResults.map(res => (
                          <div 
                            key={res.id} 
                            onClick={() => addIncludedParam(res)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-[14px] font-medium text-near-black">{res.name}</div>
                              <div className="text-[12px] text-gray-500 font-mono">{res.sku}</div>
                            </div>
                            <Plus className="w-4 h-4 text-primary" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-[16px] bg-gray-50/30 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b border-gray-200 text-[13px] font-medium text-gray-700">
                      Included Parameters ({includedParams.length})
                    </div>
                    {includedParams.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-[14px] italic">
                        No parameters included yet. Use the search bar above.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {includedParams.map(param => (
                          <div key={param.id} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-[12px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{param.sku}</span>
                              <span className="text-[14px] text-near-black font-medium">{param.name}</span>
                            </div>
                            <button type="button" onClick={() => removeIncludedParam(param.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3 sticky bottom-0 z-20">
          <Button variant="secondary" onClick={onClose} className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="test-form" className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Test'}
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
}
