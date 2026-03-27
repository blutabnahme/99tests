"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp?: string;
}

export function CookieConsent() {
  const t = useTranslations('cookie');
  const tc = useTranslations('common');
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // Exclude from authenticated panels
  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/dashboard') || 
                         pathname?.startsWith('/bc');

  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    setMounted(true);
    
    const handleOpenSettings = () => setShowPreferences(true);
    window.addEventListener('open-cookie-settings', handleOpenSettings);
    
    // Check existing consent
    const existing = getConsentCookie();
    if (!existing) {
       // Show banner after short delay
       const timer = setTimeout(() => setShowBanner(true), 1000);
       return () => clearTimeout(timer);
    } else {
       setPreferences(existing);
    }
    
    return () => window.removeEventListener('open-cookie-settings', handleOpenSettings);
  }, []);

  if (!mounted || isExcludedPath) return null;

  const handleAcceptAll = () => {
    const prefs = { essential: true, analytics: true, marketing: true };
    setPreferences(prefs);
    setConsentCookie(prefs);
    closeAll();
  };

  const handleRejectAll = () => {
    const prefs = { essential: true, analytics: false, marketing: false };
    setPreferences(prefs);
    setConsentCookie(prefs);
    closeAll();
  };

  const handleSavePreferences = () => {
    setConsentCookie(preferences);
    closeAll();
  };

  const closeAll = () => {
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleToggle = (key: keyof ConsentPreferences) => {
    if (key === 'essential') return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Settings Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-near-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] shadow-xl p-6 max-w-[520px] w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-[20px] font-medium text-near-black mb-2 font-heading tracking-tight">{t('title')}</h2>
            <p className="text-[14px] text-gray-500 mb-6">
              {t('description')}
            </p>

            <div className="space-y-1 mb-8">
              {/* Essential */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="pr-4">
                  <div className="text-[14px] font-medium text-near-black">{t('essential')}</div>
                  <div className="text-[12px] text-gray-500 mt-1">{t('essentialDesc')}</div>
                </div>
                <button 
                  disabled
                  className="w-11 h-6 shrink-0 bg-primary rounded-full relative cursor-not-allowed opacity-70 transition-all duration-200"
                >
                  <span className="absolute left-[2px] top-[2px] w-[20px] h-[20px] bg-white rounded-full translate-x-5 transition-all duration-200" />
                </button>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="pr-4">
                  <div className="text-[14px] font-medium text-near-black">{t('analytics')}</div>
                  <div className="text-[12px] text-gray-500 mt-1">{t('analyticsDesc')}</div>
                </div>
                <button 
                  onClick={() => handleToggle('analytics')}
                  className={`w-11 h-6 shrink-0 rounded-full relative transition-all duration-200 ${preferences.analytics ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`absolute left-[2px] top-[2px] w-[20px] h-[20px] bg-white rounded-full transition-all duration-200 ${preferences.analytics ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="pr-4">
                  <div className="text-[14px] font-medium text-near-black">{t('marketing')}</div>
                  <div className="text-[12px] text-gray-500 mt-1">{t('marketingDesc')}</div>
                </div>
                <button 
                  onClick={() => handleToggle('marketing')}
                  className={`w-11 h-6 shrink-0 rounded-full relative transition-all duration-200 ${preferences.marketing ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`absolute left-[2px] top-[2px] w-[20px] h-[20px] bg-white rounded-full transition-all duration-200 ${preferences.marketing ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={closeAll}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {tc("cancel")}
              </button>
              <button 
                onClick={handleSavePreferences}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-white bg-primary hover:bg-primary-dark transition-colors"
              >
                {t('savePreferences')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Banner */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] px-4 sm:px-6 lg:px-12 py-4 sm:py-5 transition-transform duration-500 ease-out ${
          showBanner && !showPreferences ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-[13px] sm:text-[14px] text-gray-700 flex-1 whitespace-nowrap text-ellipsis overflow-hidden sm:whitespace-normal">
            {t('bannerText')}<Link href="/privacy" className="text-primary hover:text-primary-dark underline">{t('privacyPolicy')}</Link>.
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button 
              onClick={() => setShowPreferences(true)}
              className="text-[13px] text-gray-500 hover:text-near-black underline order-3 sm:order-1 mt-1 sm:mt-0"
            >
              {t('managePreferences')}
            </button>
            <button 
              onClick={handleRejectAll}
              className="w-full sm:w-auto border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black rounded-full font-semibold px-5 py-2 text-[13px] order-2"
            >
              {t('rejectAll')}
            </button>
            <button 
              onClick={handleAcceptAll}
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white rounded-full font-semibold px-5 py-2 text-[13px] order-1 sm:order-3"
            >
              {t('acceptAll')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Helpers
function setConsentCookie(preferences: ConsentPreferences) {
  const value = JSON.stringify({
    ...preferences,
    timestamp: new Date().toISOString(),
  });
  document.cookie = `99tests_consent=${encodeURIComponent(value)};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
}

function getConsentCookie(): ConsentPreferences | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/99tests_consent=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}
