"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useTranslations } from "next-intl";
import { ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
};

export default function PublicFAQPage() {
  const t = useTranslations('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const CATEGORIES = [
    { id: "all", label: t('catAll') },
    { id: "companies", label: t('catCompanies') },
    { id: "collectors", label: t('catCollectors') },
    { id: "patients", label: t('catPatients') },
    { id: "payments", label: t('catPayments') },
    { id: "platform", label: t('catPlatform') },
  ];

  useEffect(() => {
    async function loadFaqs() {
      try {
        const res = await fetch("/api/faq");
        if (res.ok) {
          const data = await res.json();
          setFaqs(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  const filteredFaqs = activeCategory === "all" ? faqs : faqs.filter(f => f.category === activeCategory);

  return (
    <div className="font-body text-near-black bg-white min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-[100px] sm:pt-[140px] pb-14 sm:pb-24 px-6 lg:px-12 text-center flex-shrink-0">
        <div className="max-w-[800px] mx-auto">
          <span className="text-primary text-[13px] font-medium uppercase tracking-wide block mb-4">
            {t('heroBadge')}
          </span>
          <h1 className="font-heading text-[30px] sm:text-[36px] lg:text-[54px] font-medium text-near-black mb-5 tracking-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-[17px] sm:text-[19px] text-gray-500 leading-relaxed font-light">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Filters and List */}
      <section className="flex-grow pb-24 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto w-full">
          
          {/* Desktop Pills */}
          <div className="hidden sm:flex flex-wrap items-center justify-center gap-2 mb-10">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setOpenId(null); }}
                className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-colors border ${
                  activeCategory === cat.id 
                    ? "bg-near-black text-white border-near-black" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Mobile Dropdown */}
          <div className="block sm:hidden mb-10">
            <select
              value={activeCategory}
              onChange={(e) => { setActiveCategory(e.target.value); setOpenId(null); }}
              className="w-full h-12 rounded-full border border-gray-200 px-5 text-[15px] font-medium bg-white focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none appearance-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Accordion */}
          <div className="border-t border-gray-100">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-300" />
                <span className="text-[14px]">{t('loadingAnswers')}</span>
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="py-20 text-center text-gray-500 text-[15px]">
                {t('noQuestions')}
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div key={faq.id} className="border-b border-gray-100">
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="w-full flex justify-between items-center py-5 sm:py-6 cursor-pointer text-left hover:text-primary transition-colors group"
                    >
                      <span className="text-[16px] sm:text-[17px] font-medium text-near-black pr-8 group-hover:text-primary transition-colors leading-snug">
                        {faq.question}
                      </span>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`} 
                      />
                    </button>
                    
                    {isOpen && (
                      <div className="pb-6 sm:pb-8 pr-8 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-[15px] text-gray-500 leading-relaxed whitespace-pre-wrap">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      </section>

      {/* CTA Layer */}
      <section className="bg-gray-50 py-14 sm:py-20 lg:py-[100px] px-6 text-center mt-auto border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[20px] font-medium text-near-black mb-3">{t('ctaTitle')}</h2>
          <p className="text-[15px] text-gray-500 mb-8">
            {t('ctaSubtitle')}
          </p>
          <Link href="/contact" className="inline-flex items-center justify-center px-7 py-3 text-[15px] bg-primary hover:bg-primary-dark text-white rounded-full font-semibold shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px] transition-all">
            {t('contactBtn')}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
