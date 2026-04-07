"use client";

import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function PortalLoginPage() {
  const [contact, setContact] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async () => {
    if (!contact.trim()) return;
    setSending(true);
    setError('');
    setSent(false);

    try {
      const res = await fetch('/api/portal/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim(), channel }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send');

      setSent(true);
      if (data._dev_link) setDevLink(data._dev_link);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const isEmail = contact.includes('@');

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center">
          <img src="/logo.svg" alt="99Tests" className="h-6 w-auto" />
        </div>
      </div>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center px-5 pb-20">
        <div className="w-full max-w-[420px]">
          {!sent ? (
            <>
              <h1 className="font-heading font-medium text-[28px] text-near-black tracking-tight text-center mb-2">
                Welcome to your portal
              </h1>
              <p className="text-gray-500 text-[14px] text-center mb-8">
                Enter your email or phone number to receive a login link.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-[13px] rounded-[12px] border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-5">
                {/* Contact input */}
                <div>
                  <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Email or phone number</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="name@example.com or +49..."
                    className="w-full rounded-full border border-gray-200 px-4 py-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                {/* Channel selector (only show if phone detected) */}
                {!isEmail && contact.length > 3 && (
                  <div>
                    <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">Send via</label>
                    <div className="flex gap-2">
                      {[
                        { id: 'sms' as const, icon: Phone, label: 'SMS' },
                        { id: 'whatsapp' as const, icon: MessageCircle, label: 'WhatsApp' },
                      ].map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => setChannel(ch.id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border text-[13px] font-medium transition-colors ${
                            channel === ch.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <ch.icon className="w-4 h-4" />
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={sending || contact.trim().length < 3}
                  className="w-full rounded-full bg-primary text-white py-3 text-[15px] font-semibold hover:bg-[#005C5F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Send login link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[12px] text-gray-400 text-center mt-4">
                No password needed. We'll send a secure link that expires in 30 minutes.
              </p>
            </>
          ) : (
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-heading font-medium text-[24px] text-near-black mb-2">Check your {isEmail ? 'inbox' : 'messages'}</h2>
              <p className="text-gray-500 text-[14px] mb-6">
                We sent a login link to <span className="font-semibold text-near-black">{contact}</span>. It expires in 30 minutes.
              </p>

              {/* DEV ONLY — show link in development */}
              {devLink && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-[12px] text-[12px]">
                  <div className="font-bold text-amber-700 mb-1">DEV MODE — Magic Link:</div>
                  <a href={devLink} className="text-primary underline break-all">{devLink}</a>
                </div>
              )}

              <button
                onClick={() => { setSent(false); setContact(''); setDevLink(''); }}
                className="text-primary text-[14px] font-medium hover:underline"
              >
                Try a different email or phone
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
