"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";

export default function PricingPage() {
  const t = useTranslations('pricing');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pricing, setPricing] = useState({
    practice_org_fee: 20,
    home_org_fee: 35,
    commission_rate: 17.5
  });

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        if (data && data.practice_org_fee) {
          setPricing(data);
        }
      })
      .catch(err => console.error("Could not fetch pricing data", err));
  }, []);

  const hcFeatures = [
    t('hcFeature1'),
    t('hcFeature2'),
    t('hcFeature3'),
    t('hcFeature4'),
    t('hcFeature5'),
    t('hcFeature6')
  ];

  const bcFeatures = [
    t('bcFeature1'),
    t('bcFeature2'),
    t('bcFeature3'),
    t('bcFeature4'),
    t('bcFeature5'),
    t('bcFeature6')
  ];

  const faqs = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
    { q: t('faq5Q'), a: t('faq5A') }
  ];

  return (
    <div className="font-body text-near-black bg-white overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="pt-[100px] sm:pt-[140px] pb-14 sm:pb-24 px-6 lg:px-12 bg-white text-center">
        <div className="max-w-[1280px] mx-auto">
          <span className="text-primary text-[13px] font-medium uppercase tracking-wide block mb-4">
            {t('heroBadge')}
          </span>
          <h1 className="font-heading text-[30px] sm:text-[36px] lg:text-[54px] font-medium text-near-black mb-5.5">
            {t('heroTitle')}
          </h1>
          <p className="text-[16px] sm:text-[18px] text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="bg-white pb-16 sm:pb-24 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Doctor Card */}
          <div className="bg-white rounded-lg border border-gray-200 border-t-2 border-t-99tests-red pt-6 px-6 pb-5 sm:pt-8 sm:px-8 sm:pb-6 flex flex-col h-full hover:shadow-lg transition-shadow relative">
            <h3 className="text-[18px] sm:text-[20px] font-medium text-near-black mb-1">
              {t('hcCardTitle')}
            </h3>
            <div className="text-[14px] text-gray-500 mb-6">
              {t('hcCardDesc')}
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="text-[13px] text-gray-400 uppercase tracking-widest mb-1">{t('practiceVisit')}</div>
                <div className="flex items-end gap-1">
                  <span className="text-[28px] sm:text-[32px] font-medium text-near-black leading-none">€{pricing.practice_org_fee}</span>
                  <span className="text-[14px] text-gray-500 mb-1">{t('perCase')}</span>
                </div>
              </div>
              <div>
                <div className="text-[13px] text-gray-400 uppercase tracking-widest mb-1">{t('homeVisit')}</div>
                <div className="flex items-end gap-1">
                  <span className="text-[28px] sm:text-[32px] font-medium text-near-black leading-none">€{pricing.home_org_fee}</span>
                  <span className="text-[14px] text-gray-500 mb-1">{t('perCase')}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 my-6"></div>

            <ul className="space-y-3 mb-5 flex-grow">
              {hcFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 py-1">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-green-500" strokeWidth={3} />
                  </div>
                  <span className="text-[14px] text-gray-600 leading-snug">{feature}</span>
                </li>
              ))}
            </ul>

            <div>
              <Link href="/register/hc" className="flex items-center justify-center w-full px-7 py-3 text-[15px] bg-primary hover:bg-primary-dark text-white rounded-full font-semibold shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px] transition-all">
                {t('hcCardBtn')}
              </Link>
              <div className="text-[12px] text-gray-400 mt-3 text-center">
                {t('hcCardNote')}
              </div>
            </div>
          </div>

          {/* BC Card */}
          <div className="bg-white rounded-lg border border-gray-200 border-t-2 border-t-[#008085] pt-6 px-6 pb-5 sm:pt-8 sm:px-8 sm:pb-6 flex flex-col h-full hover:shadow-lg transition-shadow">
            <h3 className="text-[18px] font-medium text-near-black mb-1">
              {t('bcCardTitle')}
            </h3>
            <div className="text-[13px] text-gray-400 mb-6">
              {t('bcCardDesc')}
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="h-[52px]"> {/* Placeholder to keep alignment with Doctor Card */} </div>
              <div>
                <div className="text-[13px] text-gray-400 uppercase tracking-widest mb-1">{t('allVisits')}</div>
                <div className="flex items-end gap-1">
                  <span className="text-[36px] sm:text-[42px] font-medium text-near-black leading-none">{pricing.commission_rate}%</span>
                  <span className="text-[14px] text-gray-400 ml-1">{t('perCollection')}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 my-6"></div>

            <ul className="space-y-3 mb-5 flex-grow">
              {bcFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 py-1">
                  <div className="mt-1 shrink-0">
                    <Check className="w-4 h-4 text-[#008085]" strokeWidth={3} />
                  </div>
                  <span className="text-[14px] text-gray-600 leading-snug">{feature}</span>
                </li>
              ))}
            </ul>

            <div>
              <Link href="/register/bc" className="flex items-center justify-center w-full px-7 py-3 text-[15px] bg-primary hover:bg-[#157575] text-white rounded-full font-semibold transition-all">
                {t('bcCardBtn')}
              </Link>
              <div className="text-[12px] text-gray-400 mt-3 text-center">
                {t('bcCardNote')}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* PATIENT PRICING SECTION */}
      <section className="bg-gray-50 py-14 sm:py-20 lg:py-[100px] px-6 lg:px-12 border-y border-gray-100">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 sm:mb-14 text-center">
            <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black">
              {t('patientTitle')}
            </h2>
            <p className="text-[15px] sm:text-[16px] text-gray-500 mt-3 max-w-2xl mx-auto">
              {t('patientSubtitle')}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 max-w-lg mx-auto shadow-sm">
            <div className="flex justify-between py-3 border-b border-gray-100 items-center">
              <span className="text-[14px] font-medium text-near-black">{t('patientItem1')}</span>
              <span className="font-mono text-[14px] font-medium text-near-black">{t('patientItem1Value')}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100 items-center">
              <span className="text-[14px] font-medium text-near-black flex items-center gap-1.5">
                {t('patientItem2')} <span className="text-[12px] text-gray-400 font-normal">{t('patientItem2Note')}</span>
              </span>
              <span className="font-mono text-[14px] font-medium text-near-black">€0.40/km</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100 items-center">
              <span className="text-[14px] font-medium text-near-black">{t('patientItem3')}</span>
              <span className="font-mono text-[14px] font-medium text-near-black">+50%</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100 items-center">
              <span className="text-[14px] font-medium text-near-black">{t('patientItem4')}</span>
              <span className="font-mono text-[14px] font-medium text-near-black">+100%</span>
            </div>
            <div className="flex justify-between py-3 pt-4 items-center">
              <span className="text-[14px] font-medium text-near-black flex items-center gap-1.5">
                {t('patientItem5')} <span className="text-[12px] text-gray-400 font-normal">{t('patientItem5Note')}</span>
              </span>
              <span className="font-mono text-[14px] font-medium text-near-black">19%</span>
            </div>
          </div>
          <div className="text-[13px] text-gray-400 text-center mt-5">
            {t('patientNote')}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-white py-14 sm:py-20 lg:py-[100px] px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-12 sm:mb-16 text-center">
            <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black">
              {t('faqTitle')}
            </h2>
          </div>

          <div className="max-w-2xl mx-auto border-t border-gray-100">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="border-b border-gray-100">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex justify-between items-center py-5 text-left focus:outline-none group hover:bg-gray-50/50 transition-colors px-2"
                  >
                    <span className="text-[15px] font-medium text-near-black pr-8">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'group-hover:text-near-black'}`}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isOpen ? "200px" : "0",
                      opacity: isOpen ? 1 : 0
                    }}
                  >
                    <div className="text-[14px] text-gray-500 leading-relaxed pb-6 pt-1 px-2">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-primary py-14 sm:py-20 lg:py-[100px] px-6 lg:px-12 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-[800px] mx-auto relative z-10">
          <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-white tracking-tight mb-3">
            {t('ctaTitle')}
          </h2>
          <p className="text-[16px] text-white/90 mb-8 max-w-2xl mx-auto font-medium">
            {t('ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register/hc" className="flex items-center justify-center px-7 py-3 text-[15px] bg-white text-primary rounded-full font-semibold shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:bg-gray-50 hover:-translate-y-[1px] transition-all w-full sm:w-auto">
              {t('ctaHcBtn')}
            </Link>
            <Link href="/register/bc" className="flex items-center justify-center px-7 py-3 text-[15px] bg-white/10 text-white border border-white/15 hover:bg-white/20 rounded-full font-semibold transition-all w-full sm:w-auto">
              {t('ctaBcBtn')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
