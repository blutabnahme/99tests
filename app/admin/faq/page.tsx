"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2, Plus, Edit2, Trash2, ChevronDown, ChevronRight,
  HelpCircle, X, GripVertical, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'patients', label: 'Patients' },
  { value: 'doctors', label: 'Doctors' },
];

const LANGUAGES = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
];

function getCategoryLabel(cat: string): string {
  return CATEGORIES.find(c => c.value === cat)?.label || cat || 'General';
}

function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'patients': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'doctors': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Form state
  const [formCategory, setFormCategory] = useState('general');
  const [formQuestionDe, setFormQuestionDe] = useState('');
  const [formQuestionEn, setFormQuestionEn] = useState('');
  const [formAnswerDe, setFormAnswerDe] = useState('');
  const [formAnswerEn, setFormAnswerEn] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faq');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFaqs(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingFaq(null);
    setFormCategory('general');
    setFormQuestionDe('');
    setFormQuestionEn('');
    setFormAnswerDe('');
    setFormAnswerEn('');
    setFormSortOrder(0);
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (faq: any) => {
    setModalMode('edit');
    setEditingFaq(faq);
    setFormCategory(faq.category || 'general');
    setFormQuestionDe(faq.question?.de || '');
    setFormQuestionEn(faq.question?.en || '');
    setFormAnswerDe(faq.answer?.de || '');
    setFormAnswerEn(faq.answer?.en || '');
    setFormSortOrder(faq.sort_order || 0);
    setFormIsActive(faq.is_active ?? true);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const faqData = {
        category: formCategory,
        question: { de: formQuestionDe, en: formQuestionEn },
        answer: { de: formAnswerDe, en: formAnswerEn },
        sort_order: formSortOrder,
        is_active: formIsActive,
      };

      const res = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalMode === 'create' ? 'create' : 'update',
          id: editingFaq?.id,
          faq: faqData,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      setModalOpen(false);
      await fetchFaqs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ item? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchFaqs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (faq: any) => {
    try {
      await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: faq.id,
          faq: { ...faq, is_active: !faq.is_active },
        }),
      });
      await fetchFaqs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = activeCategory === 'all' ? faqs : faqs.filter(f => f.category === activeCategory);

  const inputClasses = "w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors";
  const textareaClasses = "w-full min-h-[100px] p-4 text-[14px] rounded-[12px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-y";
  const selectClasses = "h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white appearance-none";
  const selectStyle = { backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">FAQ Management</h1>
          <p className="text-gray-500 text-[14px] mt-1">Manage frequently asked questions for the 99Tests website.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} className="rounded-full shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Add FAQ
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-full p-1 w-fit">
        {[{ value: 'all', label: 'All' }, ...CATEGORIES].map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              activeCategory === cat.value ? 'bg-white text-near-black shadow-sm' : 'text-gray-500 hover:text-near-black'
            }`}
          >
            {cat.label}
            <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              activeCategory === cat.value ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'
            }`}>
              {cat.value === 'all' ? faqs.length : faqs.filter(f => f.category === cat.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100">{error}</div>}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-12 text-center">
          <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">No FAQ items found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div key={faq.id} className={`bg-white rounded-[16px] border shadow-sm overflow-hidden ${faq.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                {/* Summary */}
                <div
                  className="px-6 py-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                >
                  <div className="text-gray-300 shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(faq.category)}`}>
                        {getCategoryLabel(faq.category)}
                      </span>
                      {!faq.is_active && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">Hidden</span>
                      )}
                      <span className="text-[11px] text-gray-400 font-mono">#{faq.sort_order}</span>
                    </div>
                    <div className="text-[14px] font-medium text-near-black truncate">
                      {faq.question?.de || faq.question?.en || 'Untitled'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleToggleActive(faq)} className="p-2 text-gray-400 hover:text-primary rounded-full transition-colors" title={faq.is_active ? 'Hide' : 'Show'}>
                      {faq.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEditModal(faq)} className="p-2 text-gray-400 hover:text-primary rounded-full transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(faq.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    {LANGUAGES.map(lang => (
                      <div key={lang.code}>
                        <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">{lang.label}</div>
                        <div className="bg-gray-50 rounded-[10px] p-4 space-y-2">
                          <div className="text-[14px] font-semibold text-near-black">{faq.question?.[lang.code] || '-'}</div>
                          <div className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer?.[lang.code] || '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="font-heading font-medium text-[20px] text-near-black">
                {modalMode === 'create' ? 'Add FAQ' : 'Edit FAQ'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Category</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className={`${selectClasses} w-full`} style={selectStyle}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-700">Sort Order</label>
                    <input type="number" value={formSortOrder} onChange={e => setFormSortOrder(parseInt(e.target.value) || 0)} className={inputClasses} />
                  </div>
                  <div className="space-y-1.5 flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer text-[14px] font-medium text-gray-700 h-11">
                      <input type="checkbox" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                      Active
                    </label>
                  </div>
                </div>
              </div>

              {/* German */}
              <div className="space-y-3">
                <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Deutsch</div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Question (DE) *</label>
                  <input value={formQuestionDe} onChange={e => setFormQuestionDe(e.target.value)} className={inputClasses} placeholder="Wie funktioniert 99Tests?" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Answer (DE) *</label>
                  <textarea value={formAnswerDe} onChange={e => setFormAnswerDe(e.target.value)} className={textareaClasses} placeholder="99Tests verbindet Patienten mit..." />
                </div>
              </div>

              {/* English */}
              <div className="space-y-3">
                <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">English</div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Question (EN)</label>
                  <input value={formQuestionEn} onChange={e => setFormQuestionEn(e.target.value)} className={inputClasses} placeholder="How does 99Tests work?" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Answer (EN)</label>
                  <textarea value={formAnswerEn} onChange={e => setFormAnswerEn(e.target.value)} className={textareaClasses} placeholder="99Tests connects patients with..." />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-end gap-3 rounded-b-[16px]">
              <Button variant="secondary" onClick={() => setModalOpen(false)} className="rounded-full px-6 h-10 text-[14px]" disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} className="rounded-full px-6 h-10 text-[14px]" disabled={saving || !formQuestionDe}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : modalMode === 'create' ? 'Add FAQ' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
