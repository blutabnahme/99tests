"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Webhook, Key, Copy, Check, Plus, Trash2,
  RefreshCw, AlertCircle, CheckCircle2, XCircle, Eye, EyeOff, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const AVAILABLE_EVENTS = [
  { id: 'recommendation.created', label: 'Recommendation Created' },
  { id: 'recommendation.sent', label: 'Recommendation Sent' },
  { id: 'recommendation.paid', label: 'Recommendation Paid' },
  { id: 'recommendation.cancelled', label: 'Recommendation Cancelled' },
  { id: 'order.created', label: 'Order Created' },
  { id: 'order.paid', label: 'Order Paid' },
  { id: 'order.shipped', label: 'Order Shipped' },
  { id: 'order.results_ready', label: 'Results Ready' },
];

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function WebhooksPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'webhooks' | 'api_keys' | 'logs'>('webhooks');

  // Webhook form
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookActive, setWebhookActive] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // API key
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const inputClasses = "w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400";

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/doctors/${params.id}/webhooks`);
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      setData(d);
      if (d.webhook) {
        setWebhookUrl(d.webhook.webhook_url || '');
        setWebhookActive(d.webhook.is_active || false);
        setSelectedEvents(d.webhook.events || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      const res = await fetch(`/api/admin/users/doctors/${params.id}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_webhook', webhook_url: webhookUrl, events: selectedEvents, is_active: webhookActive }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSuccessMsg('Webhook configuration saved.');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setSavingWebhook(false); }
  };

  const handleRegenerateSecret = async () => {
    if (!confirm('Regenerate webhook secret? The old secret will stop working immediately.')) return;
    setActionLoading('secret');
    try {
      const res = await fetch(`/api/admin/users/doctors/${params.id}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_secret' }),
      });
      if (!res.ok) throw new Error('Failed');
      setSuccessMsg('Webhook secret regenerated.');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleGenerateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch(`/api/admin/users/doctors/${params.id}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_api_key', label: newKeyLabel || 'Default' }),
      });
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      setNewlyGeneratedKey(d.api_key);
      setNewKeyLabel('');
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setGeneratingKey(false); }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Revoke this API key? It will stop working immediately.')) return;
    setActionLoading(keyId);
    try {
      await fetch(`/api/admin/users/doctors/${params.id}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_api_key', key_id: keyId }),
      });
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const tabs = [
    { id: 'webhooks' as const, label: 'Webhooks', icon: Webhook },
    { id: 'api_keys' as const, label: `API Keys (${data?.api_keys?.length || 0})`, icon: Key },
    { id: 'logs' as const, label: `Delivery Log (${data?.logs?.length || 0})`, icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      <Link href={`/admin/users/doctors/${params.id}`} className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to {data?.doctor?.full_name || 'Doctor'}
      </Link>

      <div>
        <h1 className="font-heading font-medium text-[24px] text-near-black tracking-tight" style={{ textTransform: 'none' }}>Webhooks & API</h1>
        <p className="text-gray-500 text-[14px] mt-1">Manage API access and webhook notifications for {data?.doctor?.full_name}</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 rounded-[16px] text-sm font-medium border border-green-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-near-black'
              }`}
            ><Icon className="w-3.5 h-3.5" /> {tab.label}</button>
          );
        })}
      </div>

      {/* WEBHOOKS TAB */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-[12px] border border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer text-[14px] font-medium text-gray-700">
              <input type="checkbox" checked={webhookActive} onChange={e => setWebhookActive(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              Enable Webhooks
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">Endpoint URL</label>
            <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className={inputClasses} placeholder="https://your-server.com/api/webhook" />
            <p className="text-[12px] text-gray-400">We'll send POST requests with JSON payloads to this URL.</p>
          </div>

          {data?.webhook?.webhook_secret && (
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">Signing Secret</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-11 px-4 flex items-center text-[13px] font-mono rounded-full border border-gray-200 bg-gray-50 text-gray-600 overflow-hidden">
                  {showSecret ? data.webhook.webhook_secret : '•'.repeat(40)}
                </div>
                <button onClick={() => setShowSecret(!showSecret)} className="p-2.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => copyToClipboard(data.webhook.webhook_secret)} className="p-2.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={handleRegenerateSecret} disabled={actionLoading === 'secret'} className="p-2.5 text-gray-400 hover:text-amber-600 rounded-full hover:bg-amber-50 transition-colors">
                  {actionLoading === 'secret' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[12px] text-gray-400">Used to verify webhook signatures. Keep this secret.</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-700">Events</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map(event => (
                <label key={event.id} className="flex items-center gap-2 cursor-pointer text-[14px] text-gray-700 p-2 rounded-[8px] hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedEvents([...selectedEvents, event.id]);
                      else setSelectedEvents(selectedEvents.filter(ev => ev !== event.id));
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {event.label}
                </label>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={handleSaveWebhook} disabled={savingWebhook} className="rounded-full">
            {savingWebhook ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Save Webhook Configuration
          </Button>
        </div>
      )}

      {/* API KEYS TAB */}
      {activeTab === 'api_keys' && (
        <div className="space-y-6">
          {/* Generate new key */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Generate New Key</h2>
            <div className="flex items-center gap-3">
              <input type="text" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} className={`${inputClasses} max-w-xs`} placeholder="Key label (e.g. Production)" />
              <Button variant="primary" onClick={handleGenerateApiKey} disabled={generatingKey} className="rounded-full shrink-0">
                {generatingKey ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                Generate
              </Button>
            </div>

            {newlyGeneratedKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-4 space-y-2">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-800">
                  <AlertCircle className="w-4 h-4" /> Copy your API key now — it won't be shown again
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[13px] font-mono bg-white px-3 py-2 rounded-[8px] border border-amber-200 text-near-black break-all">{newlyGeneratedKey}</code>
                  <button onClick={() => copyToClipboard(newlyGeneratedKey)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-full transition-colors shrink-0">
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Existing keys */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Active Keys</h2>
            </div>
            {(data?.api_keys || []).length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-[14px]">
                <Key className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                No API keys generated
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {(data.api_keys || []).map((key: any) => (
                  <div key={key.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-near-black">{key.label}</span>
                        {!key.is_active && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Revoked</span>}
                      </div>
                      <div className="text-[12px] text-gray-500 font-mono mt-0.5">{key.key_prefix}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Created {formatDate(key.created_at)}
                        {key.last_used_at ? ` · Last used ${formatDate(key.last_used_at)}` : ' · Never used'}
                      </div>
                    </div>
                    {key.is_active && (
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        disabled={actionLoading === key.id}
                        className="text-[13px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                      >
                        {actionLoading === key.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELIVERY LOG TAB */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
          {(data?.logs || []).length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-[14px]">
              <Webhook className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              No webhook deliveries yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] whitespace-nowrap">
                <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Response</th>
                    <th className="px-6 py-4">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.logs || []).map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3">
                        {log.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </td>
                      <td className="px-6 py-3 text-[13px] font-mono text-gray-700">{log.event_type}</td>
                      <td className="px-6 py-3">
                        <span className={`text-[12px] font-mono font-medium px-2 py-0.5 rounded-full ${
                          log.response_status >= 200 && log.response_status < 300
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {log.response_status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-[13px]">{formatDate(log.delivered_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
