"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useTranslations } from 'next-intl';
import { FlagIcon } from "@/components/ui/FlagIcon";

const languages = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "nl", label: "Nederlands" },
];

const navLinks = [
  { href: "/for-companies", label: "nav.forCompanies" },
  { href: "/for-professionals", label: "nav.forProfessionals" },
  { href: "/how-it-works", label: "nav.howItWorks" },
  { href: "/pricing", label: "nav.pricing" },
  { href: "/about", label: "nav.about" },
  { href: "/contact", label: "nav.contact" },
];

export function Navbar() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  
  const [scrollY, setScrollY] = useState(0);
  const [navLangOpen, setNavLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(languages[0]);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
    if (match) {
      const code = match[1].toLowerCase();
      const found = languages.find(l => l.code === code);
      if (found) setActiveLang(found);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLangSelect = (lang: any, setOpen: (val: boolean) => void) => {
    document.cookie = `NEXT_LOCALE=${lang.code};path=/;max-age=31536000`;
    setActiveLang(lang);
    setOpen(false);
    if (setOpen === setMobileLangOpen) {
      setMobileMenuOpen(false);
    }
    router.refresh();
  };

  const navBg = scrollY > 60 || mobileMenuOpen;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between ${navBg ? "bg-white/90 backdrop-blur-md border-b border-gray-200/50" : "bg-transparent border-b border-transparent"}`}>
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="99Tests" className="h-6 w-auto relative z-50" />
          </Link>
          <div className="hidden lg:flex gap-7">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} className={`text-[14px] font-medium transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:bg-primary after:transition-all after:duration-300 ${isActive ? 'text-near-black after:w-full' : 'text-gray-500 hover:text-near-black after:w-0 hover:after:w-full'}`}>
                  {t(link.label)}
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 relative z-50">
          <div className="relative inline-flex">
            <button className="flex items-center gap-1.5 px-2.5 py-1 hidden sm:flex border border-gray-200 rounded-full bg-transparent text-[13px] font-medium text-gray-500 hover:border-gray-300 hover:text-near-black transition-all" onClick={() => setNavLangOpen(!navLangOpen)}>
              <FlagIcon locale={activeLang.code} className="w-[18px] h-[13px] rounded-sm object-cover shrink-0" />
              <span>{activeLang.code.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {navLangOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-dropdown shadow-lg p-1.5 min-w-[160px] z-[200]">
                {languages.map((lang) => (
                  <button key={lang.code}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-left text-[13px] font-medium transition-colors ${activeLang.code === lang.code ? "text-primary bg-open-bg" : "text-gray-700 hover:bg-gray-50 hover:text-near-black"}`}
                    onClick={() => handleLangSelect(lang, setNavLangOpen)}>
                    <FlagIcon locale={lang.code} className="w-[20px] h-[14px] rounded-sm object-cover shrink-0" />
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link href="/login" className="hidden sm:inline-block text-gray-500 text-[14px] font-medium hover:text-near-black transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1.5px] after:bg-primary hover:after:w-full after:transition-all after:duration-300">
            {t('auth.login')}
          </Link>
          <Link href="/register" className="bg-primary text-white rounded-full px-[18px] sm:px-[22px] py-1.5 sm:py-2 text-[13px] sm:text-[14px] font-semibold hover:bg-primary-dark transition-all hover:-translate-y-[1px] shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] flex items-center">
            {t('auth.register')}
          </Link>
          
          <button 
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-near-black hover:bg-gray-100 transition-colors ml-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={() => setMobileMenuOpen(false)}></div>
      
      <div className={`lg:hidden fixed top-16 left-0 right-0 bottom-0 z-40 bg-white overflow-y-auto transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="px-5 py-6 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[16px] font-medium py-3 px-3 rounded-lg transition-colors ${
                  isActive ? "text-primary bg-open-bg" : "text-near-black hover:bg-gray-50"
                }`}
              >
                {t(link.label)}
              </Link>
            );
          })}
          
          <div className="border-t border-gray-100 my-3"></div>
          
          <Link href="/login" className="text-[16px] font-medium text-gray-500 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
            {t('auth.login')}
          </Link>
          
          <button 
            className="w-full flex items-center justify-between text-[16px] font-medium text-gray-500 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setMobileLangOpen(!mobileLangOpen)}
          >
            <div className="flex items-center gap-2">
              <FlagIcon locale={activeLang.code} className="w-[20px] h-[14px] rounded-sm object-cover shrink-0" />
              <span>{activeLang.label}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileLangOpen ? "rotate-180" : ""}`} />
          </button>
          
          {mobileLangOpen && (
            <div className="ml-3 flex flex-col gap-1 mt-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-left text-[15px] font-medium transition-colors ${
                    activeLang.code === lang.code ? "text-primary bg-open-bg" : "text-gray-500 hover:text-near-black hover:bg-gray-50"
                  }`}
                  onClick={() => handleLangSelect(lang, setMobileLangOpen)}
                >
                  <FlagIcon locale={lang.code} className="w-[20px] h-[14px] rounded-sm object-cover shrink-0" />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
