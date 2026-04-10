"use client";

import { useState, useEffect } from "react";
import { Key, Copy, Check, Lock, ShieldAlert, Activity, Power, X } from "lucide-react";
import { generateApiKey, getApiConfig, getApiLogs, updateApiConfig, updateWebhookUrl, generateWebhookSecret, getWebhookLogs } from "./api-actions";
import { formatDate } from '@/lib/format-date';
import { Button } from "@/components/ui/Button";

interface Props {
 hcId: string;
 hcName: string;
 onClose: () => void;
}

export function HcApiSettingsModal({ hcId, hcName, onClose }: Props) {
 const [config, setConfig] = useState<any>(null);
 const [logs, setLogs] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 
 const [newKey, setNewKey] = useState<string | null>(null);
 const [copied, setCopied] = useState(false);
 
 const [isSaving, setIsSaving] = useState(false);
 const [enabled, setEnabled] = useState(false);
 const [rateLimit, setRateLimit] = useState(100);

 const [webhookUrl, setWebhookUrl] = useState('');
 const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
 const [newWhSecret, setNewWhSecret] = useState<string | null>(null);

 useEffect(() => {
 async function init() {
 try {
 const [cData, lData, whLogsData] = await Promise.all([
 getApiConfig(hcId),
 getApiLogs(hcId),
 getWebhookLogs(hcId)
 ]);
 setConfig(cData);
 setEnabled(cData.api_enabled || false);
 setRateLimit(cData.api_rate_limit || 100);
 setWebhookUrl(cData.webhook_url || '');
 setLogs(lData);
 setWebhookLogs(whLogsData);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 }
 init();
 }, [hcId]);

 const handleCopy = () => {
 if (newKey) {
 navigator.clipboard.writeText(newKey);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 };

 const handleGenerate = async () => {
 if (!window.confirm("Generating a new API key will instantly invalidate the old one. Continue?")) return;
 try {
 setLoading(true);
 const key = await generateApiKey(hcId);
 setNewKey(key);
 const updatedConfig = await getApiConfig(hcId);
 setConfig(updatedConfig);
 setEnabled(true);
 } catch (err) {
 console.error(err);
 alert("Failed to generate API Key.");
 } finally {
 setLoading(false);
 }
 };

 const handleGenerateWebhook = async () => {
 if (!window.confirm("Generating a new Webhook Secret will invalidate existing payload signatures. Continue?")) return;
 try {
 setLoading(true);
 const secret = await generateWebhookSecret(hcId);
 setNewWhSecret(secret);
 const updatedConfig = await getApiConfig(hcId);
 setConfig(updatedConfig);
 } catch (err) {
 console.error(err);
 alert("Failed to generate Webhook Secret.");
 } finally {
 setLoading(false);
 }
 };

 const handleSaveConfig = async () => {
 setIsSaving(true);
 try {
 await updateApiConfig(hcId, enabled, rateLimit);
 await updateWebhookUrl(hcId, webhookUrl || null);
 const updated = await getApiConfig(hcId);
 setConfig(updated);
 } catch(err) {
 console.error(err);
 alert("Failed to save config.");
 } finally {
 setIsSaving(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
 <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
 
 {/* Header */}
 <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-slate-50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
 <Lock className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-[18px] font-medium text-near-black leading-tight">API Management</h2>
 <p className="text-[13px] text-gray-500 font-medium">Configuration for {hcName}</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <a href="/api-docs" target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-blue-600 hover:text-blue-800 transition-colors">
 View API Documentation
 </a>
 <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6 space-y-8">
 
 {loading ? (
 <div className="py-20 text-center text-gray-500">Loading Configuration...</div>
 ) : (
 <>
 {/* 1. KEY GENERATION RESULT */}
 {newKey && (
 <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-4 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full -z-10 mix-blend-multiply opacity-50" />
 <div className="flex items-center gap-2 mb-2">
 <ShieldAlert className="w-5 h-5 text-emerald-600" />
 <span className="font-bold text-emerald-900 text-[14px]">New API Key Generated Successfully</span>
 </div>
 <p className="text-[13px] text-emerald-800/80 mb-4 max-w-lg">
 Store this key securely. For security reasons, <strong>it will not be shown again</strong>. If you lose it, you must generate a new one.
 </p>
 
 <div className="flex items-center gap-2 bg-white/60 p-1.5 rounded-lg border border-emerald-200/50">
 <code className="flex-1 text-[13px] font-mono font-bold text-near-black px-3 overflow-x-auto whitespace-nowrap hide-scrollbar">
 {newKey}
 </code>
 <Button variant="primary" className="shrink-0 h-9" onClick={handleCopy}>
 {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />} 
 {copied ? "Copied" : "Copy"}
 </Button>
 </div>
 </div>
 )}

 {/* 2. CONFIG SETTINGS */}
 <div className="space-y-6">
 <div>
 <h3 className="text-[14px] font-medium text-near-black mb-1 flex items-center gap-2"><Key className="w-4 h-4 text-gray-500" /> Authentication Integrity</h3>
 <p className="text-[13px] text-gray-500 mb-4">The active access token prefix tied to this account.</p>
 <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
 <span className="text-[14px] font-mono font-bold text-gray-500">
 {config?.api_key_prefix ? `${config.api_key_prefix}*****************` : 'No API Key Generated'}
 </span>
 <Button variant="secondary" className="h-8 text-[12px]" onClick={handleGenerate}>
 Re-Generate Key
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 {/* Toggle */}
 <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
 <div className="flex items-center gap-2 text-[14px] font-bold text-near-black mb-2">
 <Power className="w-4 h-4 text-gray-500" /> API Access Status
 </div>
 <label className="flex items-center gap-3 cursor-pointer mt-4">
 <div className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
 <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
 </div>
 <input type="checkbox" className="hidden" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
 <span className="text-[13px] font-semibold text-gray-500">{enabled ? 'Enabled' : 'Disabled'}</span>
 </label>
 </div>
 
 {/* Rate Limit */}
 <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
 <div className="flex items-center gap-2 text-[14px] font-bold text-near-black mb-2">
 <Activity className="w-4 h-4 text-gray-500" /> Rate Limit (per min)
 </div>
 <input 
 type="number" 
 min={10} max={1000} step={10}
 value={rateLimit} 
 onChange={e => setRateLimit(Number(e.target.value))} 
 className="mt-2 w-full h-10 px-3 border border-gray-300 rounded-lg text-[14px] font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
 />
 </div>
 </div>
 
 <div className="flex justify-end pt-2">
 <Button onClick={handleSaveConfig} variant="primary">
 {isSaving ? 'Saving...' : 'Save Configuration Options'}
 </Button>
 </div>
 </div>

 <div className="my-6 border-t border-gray-200" />

 {/* 2.5 WEBHOOKS CONFIGURATION */}
 <div className="space-y-6">
 <div>
 <h3 className="text-[14px] font-medium text-near-black mb-1 flex items-center gap-2"><Activity className="w-4 h-4 text-gray-500" /> Automated Webhooks</h3>
 <p className="text-[13px] text-gray-500 mb-4">Push real-time REST payloads to your internal HIS or routing engines.</p>
 
 <div className="space-y-4">
 <div>
 <label className="block text-[13px] font-bold text-near-black mb-1">Webhook URL</label>
 <input 
 type="url" 
 placeholder="https://your-domain.com/webhooks/99tests"
 value={webhookUrl} 
 onChange={e => setWebhookUrl(e.target.value)} 
 className="w-full h-10 px-3 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
 />
 </div>

 <div>
 <label className="block text-[13px] font-bold text-near-black mb-1">HMAC-SHA256 Signing Secret</label>
 <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
 <span className={`text-[14px] font-mono font-bold ${config?.webhook_secret && !newWhSecret ? 'text-emerald-700' : newWhSecret ? 'text-amber-600 tracking-tight text-[12px]' : 'text-gray-500'}`}>
 {newWhSecret ? newWhSecret : config?.webhook_secret ? `whsec_************************` : 'No Secret Configured'}
 </span>
 <Button variant="secondary" className="h-8 text-[12px]" onClick={handleGenerateWebhook}>
 Generate Secret
 </Button>
 </div>
 {newWhSecret && (
 <p className="text-[12px] font-semibold text-amber-600 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
 Copy this Secret immediately! It will never be displayed in plain text again once you close this modal.
 </p>
 )}
 </div>
 
 <div className="flex justify-end pt-2">
 <Button onClick={handleSaveConfig} variant="primary">
 {isSaving ? 'Saving...' : 'Save Webhook Options'}
 </Button>
 </div>
 </div>
 </div>
 </div>

 <div className="my-6 border-t border-gray-200" />

 {/* 3. AUDIT LOGS */}
 <div>
 <h3 className="text-[14px] font-medium text-near-black mb-4 flex items-center gap-2">
 <ShieldAlert className="w-4 h-4 text-gray-500" /> Recent API Activity
 </h3>
 
 <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
 <table className="w-full text-left whitespace-nowrap">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Time</th>
 <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Method</th>
 <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Endpoint</th>
 <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {logs.length === 0 ? (
 <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-[13px]">No recent audit logs recorded.</td></tr>
 ) : logs.map(l => (
 <tr key={l.id} className="hover:bg-gray-50">
 <td className="px-4 py-3 text-[12px] text-gray-500 font-medium">{formatDate(l.created_at)}</td>
 <td className="px-4 py-3 text-[12px] font-bold text-near-black">
 <span className={`px-2 py-0.5 rounded uppercase text-[10px] ${l.method === 'GET' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
 {l.method}
 </span>
 </td>
 <td className="px-4 py-3 text-[12px] text-gray-500 font-mono">{l.endpoint}</td>
 <td className="px-4 py-3 text-right">
 <span className={`text-[12px] font-bold ${l.response_code >= 400 ? 'text-red-500' : 'text-emerald-500'}`}>
 {l.response_code}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* 4. WEBHOOK LOGS */}
 <div className="pt-4">
 <h3 className="text-[14px] font-medium text-near-black mb-4 flex items-center gap-2">
 <Activity className="w-4 h-4 text-gray-500" /> Webhook Delivery History
 </h3>
 
 <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
 <table className="w-full text-left whitespace-nowrap">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Time</th>
 <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Event</th>
 <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Attempts</th>
 <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {webhookLogs.length === 0 ? (
 <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-[13px]">No recent webhook deliveries recorded.</td></tr>
 ) : webhookLogs.map(l => (
 <tr key={l.id} className="hover:bg-gray-50">
 <td className="px-4 py-3 text-[12px] text-gray-500 font-medium">{formatDate(l.created_at)}</td>
 <td className="px-4 py-3 text-[12px] font-bold text-near-black">
 <span className="px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-700">
 {l.event_type}
 </span>
 </td>
 <td className="px-4 py-3 text-[12px] text-gray-500 font-mono text-center">{l.attempts}/3</td>
 <td className="px-4 py-3 text-right">
 <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${l.delivered_at ? 'bg-emerald-50 text-emerald-600' : l.failed_at ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
 {l.delivered_at ? 'Delivered' : l.failed_at ? 'Failed' : 'Retrying'}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 );
}
