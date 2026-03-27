"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { FlagIcon } from "@/components/ui/FlagIcon";

const languages = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "nl", label: "Nederlands" },
];

export function Footer() {
  const t = useTranslations();
  const router = useRouter();
  const [footerLangOpen, setFooterLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(languages[0]);

  useEffect(() => {
    const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
    if (match) {
      const code = match[1].toLowerCase();
      const found = languages.find(l => l.code === code);
      if (found) setActiveLang(found);
    }
  }, []);

  const handleLangSelect = (lang: any, setOpen: (val: boolean) => void) => {
    document.cookie = `NEXT_LOCALE=${lang.code};path=/;max-age=31536000`;
    setActiveLang(lang);
    setOpen(false);
    router.refresh();
  };

  return (
    <footer className="bg-near-black pt-10 sm:pt-16 px-6 lg:px-12 pb-8">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[2.5fr_1fr_1fr_1fr] gap-8 sm:gap-12 lg:gap-16 mb-12">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-5">
            <img src="/logo-white.svg" alt="99Tests" className="h-7 w-auto" />
          </Link>
          <p className="text-[14px] leading-[1.7] text-gray-500 max-w-[280px]">
            {t('footer.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 lg:contents">
          {[
            { title: t('footer.platform'), links: [{n: t('nav.forCompanies'), u: "/for-companies"}, {n: t('nav.forCollectors'), u: "/for-professionals"}, {n: t('nav.pricing'), u: "/pricing"}, {n: t('nav.howItWorks'), u: "/how-it-works"}, {n: t('nav.faq'), u: "/faq"}] },
            { title: t('footer.company'), links: [{n: t('nav.aboutUs'), u: "/about"}, {n: t('nav.careers'), u: "#"}, {n: t('nav.press'), u: "#"}, {n: t('nav.contact'), u: "/contact"}] },
            { title: t('footer.legal'), links: [{n: t('nav.imprint'), u: "/imprint"}, {n: t('nav.privacyPolicy'), u: "/privacy"}, {n: t('nav.termsOfUse'), u: "/terms"}, {n: t('nav.cookieSettings'), u: "#cookie-settings"}] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-5">{col.title}</h4>
              <div className="flex flex-col gap-3.5">
                {col.links.map((link, j) => (
                  link.u === '#cookie-settings' ? (
                    <button key={j} onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('open-cookie-settings')); }} className="text-left text-[14px] text-gray-700 hover:text-white transition-colors block">
                      {link.n}
                    </button>
                  ) : (
                    <Link key={j} href={link.u} className="text-[14px] text-gray-700 hover:text-white transition-colors block">
                      {link.n}
                    </Link>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="max-w-[1280px] mx-auto border-t border-white/5 pt-5 sm:pt-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="text-[13px] text-gray-700">{t('footer.copyright')}</span>
        <div className="flex items-center gap-6">
          <div className="relative">
            <button className="flex items-center gap-2 px-2.5 py-1 border border-white/15 rounded-full bg-transparent text-[13px] font-medium text-gray-500 hover:border-white/30 hover:text-gray-400 transition-all" onClick={() => setFooterLangOpen(!footerLangOpen)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <FlagIcon locale={activeLang.code} className="w-[18px] h-[13px] rounded-sm object-cover shrink-0" />
              <span>{activeLang.code.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {footerLangOpen && (
              <div className="absolute bottom-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-dropdown shadow-lg p-1.5 min-w-[160px] z-[200]">
                {languages.map((lang) => (
                  <button key={lang.code}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-left font-medium text-[13px] transition-colors ${activeLang.code === lang.code ? "text-primary bg-open-bg" : "text-gray-700 hover:bg-gray-50 hover:text-near-black"}`}
                    onClick={() => handleLangSelect(lang, setFooterLangOpen)}>
                    <FlagIcon locale={lang.code} className="w-[20px] h-[14px] rounded-sm object-cover shrink-0" />
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <a href="#" className="text-gray-700 hover:text-white transition-colors text-[13px]">LinkedIn</a>
          <a href="#" className="text-gray-700 hover:text-white transition-colors text-[13px]">Twitter</a>
        </div>
      </div>
    </footer>
  );
}
