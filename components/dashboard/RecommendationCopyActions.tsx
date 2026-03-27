"use client";

import { useState } from "react";
import { Copy, CheckCircle2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

export function CopyConsentHeaderButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('hc.copyActions');
  const url = `http://localhost:3000/patient/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <a 
          href={url}
          target="_blank"
          className="bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black rounded-full px-4 py-2 text-[13px] font-semibold flex items-center gap-2 transition-all"
        >
          <ExternalLink className="w-[16px] h-[16px]" strokeWidth={2.5} />
          {t('patientPortal')}
        </a>
        <button 
          onClick={handleCopy}
          className="bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black rounded-full p-2 text-[13px] font-semibold flex items-center justify-center transition-all"
          title="Copy Link"
        >
          {copied ? <CheckCircle2 className="w-[16px] h-[16px] text-emerald-500" /> : <Copy className="w-[16px] h-[16px]" />}
        </button>
      </div>
      <button 
        onClick={handleCopy}
        className="text-[12px] text-primary font-semibold hover:text-primary-dark hover:underline px-1 transition-colors"
      >
        {copied ? t('linkCopied') : t('copyLink')}
      </button>
    </div>
  );
}

export function PatientConsentCard({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('hc.copyActions');
  const url = `http://localhost:3000/patient/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm mt-6">
      <h3 className="font-heading text-[14px] font-medium text-near-black mb-2">{t('patientUrlTitle')}</h3>
      <p className="text-[13px] text-gray-500 mb-4">{t('patientUrlDesc')}</p>
      
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1.5 pl-3">
        <div className="text-[13px] font-mono text-gray-500 truncate flex-1 select-all">{url}</div>
        <button 
          onClick={handleCopy}
          className="bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black rounded-full px-3 py-1.5 text-[12px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap"
        >
          {copied ? <CheckCircle2 className="w-[14px] h-[14px] text-emerald-500" /> : <Copy className="w-[14px] h-[14px]" />}
          {copied ? t('copied') : t('copy')}
        </button>
      </div>
    </div>
  );
}
