"use client";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Save, CheckCircle2, Mail, MessageSquare, MessageCircle, Smartphone, Globe, Info } from "lucide-react";

export default function TemplatesManagementPage() {
 const [templates, setTemplates] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState('all');
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const [savingId, setSavingId] = useState<string | null>(null);
 const [successId, setSuccessId] = useState<string | null>(null);
 const [editState, setEditState] = useState<any>({});

 useEffect(() => {
 fetchTemplates();
 }, []);

 const fetchTemplates = async () => {
 try {
 const res = await fetch(`/api/admin/templates?t=${Date.now()}`, {
 cache: 'no-store',
 headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
 });
 const data = await res.json();
 if (data.templates) {
 setTemplates(data.templates);
 }
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 const handleExpand = (template: any) => {
 if (expandedId === template.id) {
 setExpandedId(null);
 } else {
 setExpandedId(template.id);
 setEditState(template);
 }
 };

 const handleChange = (field: string, value: any) => {
 setEditState((prev: any) => ({ ...prev, [field]: value }));
 };

 const handleSave = async () => {
 if (!editState.id) return;
 setSavingId(editState.id);
 try {
 const res = await fetch(`/api/admin/templates/${editState.id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(editState)
 });
 if (res.ok) {
 setSuccessId(editState.id);
 setTemplates(prev => prev.map(t => t.id === editState.id ? editState : t));
 setTimeout(() => setSuccessId(null), 3000);
 }
 } catch (err) {
 console.error(err);
 } finally {
 setSavingId(null);
 }
 };

 const filtered = filter === 'all' ? templates : templates.filter(t => t.category === filter);

 if (loading) return <div className="p-8 text-center text-gray-500">Loading templates...</div>;

 return (
 <div className="pb-32 min-h-screen">
 <div className="mb-8">
 <h1 className="text-[28px] font-medium text-near-black tracking-tight font-heading">Notification Templates</h1>
 <p className="text-[15px] text-gray-500 mt-1">Manage notification texts across all languages and channels.</p>
 </div>

 <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
 {['all', 'patient', 'hc', 'bc', 'admin', 'system'].map(cat => (
 <button
 key={cat}
 onClick={() => setFilter(cat)}
 className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors capitalize whitespace-nowrap ${
 filter === cat 
 ? 'bg-near-black text-white' 
 : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
 }`}
 >
 {cat}
 </button>
 ))}
 </div>

 <div className="space-y-4">
 {filtered.map(t => {
 const isExpanded = expandedId === t.id;
 const isSaving = savingId === t.id;
 const isSuccess = successId === t.id;

 return (
 <div key={t.id} className={`bg-white rounded-2xl border transition-colors ${isExpanded ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
 
 {/* Header */}
 <div 
 onClick={() => handleExpand(t)}
 className="p-5 flex items-center justify-between cursor-pointer select-none"
 >
 <div className="flex items-center gap-4">
 <div className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
 t.category === 'patient' ? 'bg-blue-50 text-blue-600' :
 t.category === 'hc' ? 'bg-purple-50 text-purple-600' :
 t.category === 'bc' ? 'bg-orange-50 text-orange-600' :
 'bg-gray-100 text-gray-600'
 }`}>
 {t.category}
 </div>
 <div>
 <div className="text-[16px] font-bold text-near-black">{t.name}</div>
 <div className="text-[12px] text-gray-400 font-mono mt-1">{t.slug}</div>
 </div>
 </div>
 <div className="flex items-center gap-6">
 <div className="hidden sm:flex items-center gap-3">
 <Mail className={`w-4 h-4 ${t.send_email ? 'text-gray-900' : 'text-gray-300'}`} />
 <MessageSquare className={`w-4 h-4 ${t.send_sms ? 'text-gray-900' : 'text-gray-300'}`} />
 <MessageCircle className={`w-4 h-4 ${t.send_whatsapp ? 'text-gray-900' : 'text-gray-300'}`} />
 <Smartphone className={`w-4 h-4 ${t.send_in_app ? 'text-gray-900' : 'text-gray-300'}`} />
 </div>
 {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
 </div>
 </div>

 {/* Expanded Content */}
 {isExpanded && (
 <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
 
 <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3">
 <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
 <div>
 <div className="text-[14px] font-semibold text-blue-900">{t.description}</div>
 <div className="text-[13px] text-blue-700 mt-2 flex flex-wrap gap-1">
 Variables: 
 {Array.isArray(t.available_variables) ? t.available_variables.map((v: string) => (
 <span key={v} className="bg-white border border-blue-200 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">{'{{'}{v}{'}}'}</span>
 )) : null}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
 <div>
 <label className="text-[13px] font-bold text-gray-700 mb-2 block uppercase tracking-wider">Channels</label>
 <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
 <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleChange('send_email', !editState.send_email)}>
 <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" /> <span className="text-[14px] font-medium text-near-black">Email</span></div>
 <input type="checkbox" checked={editState.send_email} readOnly className="w-4 h-4 rounded text-primary focus:ring-primary" />
 </div>
 <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleChange('send_sms', !editState.send_sms)}>
 <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gray-500" /> <span className="text-[14px] font-medium text-near-black">SMS</span></div>
 <input type="checkbox" checked={editState.send_sms} readOnly className="w-4 h-4 rounded text-primary focus:ring-primary" />
 </div>
 <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleChange('send_whatsapp', !editState.send_whatsapp)}>
 <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-gray-500" /> <span className="text-[14px] font-medium text-near-black">WhatsApp</span></div>
 <input type="checkbox" checked={editState.send_whatsapp || false} readOnly className="w-4 h-4 rounded text-primary focus:ring-primary" />
 </div>
 <div className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer" onClick={() => handleChange('send_in_app', !editState.send_in_app)}>
 <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-gray-500" /> <span className="text-[14px] font-medium text-near-black">In-App Portal</span></div>
 <input type="checkbox" checked={editState.send_in_app} readOnly className="w-4 h-4 rounded text-primary focus:ring-primary" />
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <label className="text-[13px] font-bold text-gray-700 block uppercase tracking-wider flex items-center gap-2">
 <Globe className="w-4 h-4" /> Multi-language Content
 </label>

 {['en', 'de', 'es', 'nl', 'fr'].map((lang) => (
 <div key={lang} className="bg-white border border-gray-200 rounded-xl p-5">
 <div className="flex items-center gap-2 mb-4">
 <span className="bg-gray-100 text-gray-600 font-bold text-[12px] uppercase px-2 py-1 rounded">{lang}</span>
 <span className="text-[14px] font-semibold text-near-black">
 {lang === 'en' ? 'English' : 
 lang === 'de' ? 'German' : 
 lang === 'es' ? 'Spanish' : 
 lang === 'nl' ? 'Dutch' : 'French'}
 </span>
 </div>
 
 <div className="space-y-4">
 <div>
 <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Subject Line</label>
 <input 
 type="text" 
 value={editState[`subject_${lang}`] || ''}
 onChange={(e) => handleChange(`subject_${lang}`, e.target.value)}
 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
 />
 </div>
 <div>
 <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Body Content</label>
 <textarea 
 value={editState[`body_${lang}`] || ''}
 onChange={(e) => handleChange(`body_${lang}`, e.target.value)}
 rows={4}
 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
 />
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="mt-8 flex justify-end gap-3 sticky bottom-4">
 <button 
 onClick={() => setExpandedId(null)}
 className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
 >
 Cancel
 </button>
 <button 
 onClick={handleSave}
 disabled={isSaving}
 className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-primary hover:bg-primary-dark transition-colors shadow-md flex items-center justify-center min-w-[120px]"
 >
 {isSaving ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : isSuccess ? (
 <div className="flex items-center gap-2 "><CheckCircle2 className="w-5 h-5" /> Saved</div>
 ) : (
 <div className="flex items-center gap-2 "><Save className="w-4 h-4" /> Save Template</div>
 )}
 </button>
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 );
}
