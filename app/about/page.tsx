"use client";

import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useTranslations } from "next-intl";
import { Network, ShieldCheck, Laptop, Eye, Award, Cpu, HeartHandshake, X, Check } from "lucide-react";

export default function AboutPage() {
  const t = useTranslations('about');
  return (
    <div className="font-body text-near-black bg-white overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="pt-[100px] sm:pt-[140px] pb-14 sm:pb-24 lg:pb-[100px] px-6 lg:px-12 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-primary rounded-full blur-[100px] opacity-[0.04] -translate-y-1/2 translate-x-1/4 z-0 pointer-events-none"></div>
        <div className="max-w-[1280px] mx-auto text-center relative z-10">
          <span className="text-primary text-[13px] font-medium uppercase tracking-wide block mb-4">
            {t('heroBadge')}
          </span>
          <h1 className="font-heading text-[30px] sm:text-[36px] lg:text-[54px] font-medium text-near-black mb-5.5">
            {t('heroTitle')}
          </h1>
          <p className="text-[15px] sm:text-[17px] text-gray-500 mt-4 max-w-3xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Mini Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 sm:mt-12">
             <div className="text-center">
              <div className="text-[20px] sm:text-[28px] font-medium text-near-black">5</div>
              <div className="text-[11px] sm:text-[12px] text-gray-400 uppercase tracking-wide mt-0.5">{t('statCountries')}</div>
            </div>
            <div className="w-[1px] h-6 bg-gray-200 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-[20px] sm:text-[28px] font-medium text-near-black">2,400+</div>
              <div className="text-[11px] sm:text-[12px] text-gray-400 uppercase tracking-wide mt-0.5">{t('statProfessionals')}</div>
            </div>
            <div className="w-[1px] h-6 bg-gray-200 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-[20px] sm:text-[28px] font-medium text-near-black">2024</div>
              <div className="text-[11px] sm:text-[12px] text-gray-400 uppercase tracking-wide mt-0.5">{t('statSince')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section className="bg-white py-0 border-transparent relative">
        <div className="max-w-[1280px] mx-auto p-5 sm:p-8 lg:p-12 text-center pb-14 sm:pb-24 lg:pb-32">
          <p className="text-[16px] sm:text-[18px] lg:text-[20px] font-medium text-near-black max-w-3xl mx-auto leading-relaxed">
            {t('missionQuote')}
          </p>
          <div className="w-16 h-0.5 bg-primary mx-auto mt-6"></div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="bg-gray-50 py-14 sm:py-20 lg:py-[100px] px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 sm:mb-16 text-center">
            <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black">
              {t('problemTitle')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 lg:p-10 relative overflow-hidden group hover:shadow-lg transition-all">
              <X className="absolute top-6 right-6 w-16 h-16 text-primary/20 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
              <h3 className="text-[16px] font-medium text-near-black mb-3 relative z-10 w-3/4">{t('problemOldWay')}</h3>
              <p className="text-[14px] sm:text-[15px] text-gray-600 leading-relaxed relative z-10">
                {t('problemOldWayDesc')}
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 lg:p-10 relative overflow-hidden group hover:shadow-lg transition-all">
              <Check className="absolute top-6 right-6 w-16 h-16 text-[#008085]/20 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
              <h3 className="text-[16px] font-medium text-near-black mb-3 relative z-10 w-3/4">{t('problemBuilding')}</h3>
              <p className="text-[14px] sm:text-[15px] text-gray-600 leading-relaxed relative z-10">
                {t('problemBuildingDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR APPROACH */}
      <section className="bg-white py-14 sm:py-20 lg:py-[100px] px-6 lg:px-12 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 sm:mb-16 text-center">
            <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black">
              {t('approachTitle')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-8 hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-[48px] sm:text-[64px] font-heading font-medium text-gray-100 group-hover:text-primary/5 transition-colors select-none z-0">
                01
              </div>
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-6 shrink-0 relative z-10">
                <Network className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-[18px] font-medium text-near-black mb-3 relative z-10">{t('approach1Title')}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed flex-grow relative z-10">
                {t('approach1Desc')}
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-8 hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-[48px] sm:text-[64px] font-heading font-medium text-gray-100 group-hover:text-primary/5 transition-colors select-none z-0">
                02
              </div>
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-6 shrink-0 relative z-10">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-[18px] font-medium text-near-black mb-3 relative z-10">{t('approach2Title')}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed flex-grow relative z-10">
                {t('approach2Desc')}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-8 hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-[48px] sm:text-[64px] font-heading font-medium text-gray-100 group-hover:text-primary/5 transition-colors select-none z-0">
                03
              </div>
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-6 shrink-0 relative z-10">
                <Laptop className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-[18px] font-medium text-near-black mb-3 relative z-10">{t('approach3Title')}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed flex-grow relative z-10">
                {t('approach3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-gray-50 py-14 sm:py-20 lg:py-[100px] px-6 lg:px-12 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 sm:mb-16 text-center">
            <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black">
              {t('valuesTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 border-l-[3px] border-l-99tests-red/30 p-5 sm:p-6 hover:shadow-md hover:border-l-99tests-red transition-all flex items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                <Eye className="w-6 h-6 text-primary/70" />
              </div>
              <div className="flex-grow pt-0.5">
                <h3 className="text-[16px] sm:text-[18px] font-medium text-near-black mb-1">{t('values1Title')}</h3>
                <div className="text-[13px] sm:text-[14px] text-primary mb-2 italic">{t('values1Subtitle')}</div>
                <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed">
                  {t('values1Desc')}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 border-l-[3px] border-l-99tests-red/30 p-5 sm:p-6 hover:shadow-md hover:border-l-99tests-red transition-all flex items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-primary/70" />
              </div>
              <div className="flex-grow pt-0.5">
                <h3 className="text-[16px] sm:text-[18px] font-medium text-near-black mb-1">{t('values2Title')}</h3>
                <div className="text-[13px] sm:text-[14px] text-primary mb-2 italic">{t('values2Subtitle')}</div>
                <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed">
                  {t('values2Desc')}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 border-l-[3px] border-l-99tests-red/30 p-5 sm:p-6 hover:shadow-md hover:border-l-99tests-red transition-all flex items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                <Cpu className="w-6 h-6 text-primary/70" />
              </div>
              <div className="flex-grow pt-0.5">
                <h3 className="text-[16px] sm:text-[18px] font-medium text-near-black mb-1">{t('values3Title')}</h3>
                <div className="text-[13px] sm:text-[14px] text-primary mb-2 italic">{t('values3Subtitle')}</div>
                <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed">
                  {t('values3Desc')}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 border-l-[3px] border-l-99tests-red/30 p-5 sm:p-6 hover:shadow-md hover:border-l-99tests-red transition-all flex items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-6 h-6 text-primary/70" />
              </div>
              <div className="flex-grow pt-0.5">
                <h3 className="text-[16px] sm:text-[18px] font-medium text-near-black mb-1">{t('values4Title')}</h3>
                <div className="text-[13px] sm:text-[14px] text-primary mb-2 italic">{t('values4Subtitle')}</div>
                <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed">
                  {t('values4Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERS SECTION */}
      <section className="bg-white py-14 sm:py-20 lg:py-[100px] px-6 lg:px-12 border-t border-gray-100">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="text-[12px] uppercase tracking-widest text-gray-400 text-center mb-1">
            {t('partnersBadge')}
          </h2>
          <p className="text-[14px] text-gray-400 text-center mb-8">
            {t('partnersDesc')}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 lg:gap-14 opacity-60 hover:opacity-100 transition-opacity duration-300">
            {['aeon.life', 'aware.app', 'evi.plus', 'nu-dx.com', 'zotzklimas.de'].map((partner, i) => (
              <div key={i} className="text-[13px] sm:text-[15px] lg:text-[20px] font-heading font-medium text-gray-400 hover:text-near-black transition-colors">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-primary p-7 sm:p-10 md:p-16 lg:py-[100px] text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-[800px] mx-auto relative z-10">
          <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-white tracking-tight mb-8">
            {t('ctaTitle')}
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register/hc" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-white text-primary rounded-full font-semibold hover:bg-gray-50 hover:-translate-y-[1px] shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] transition-all">
              {t('ctaHC')}
            </Link>
            <Link href="/register/bc" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-white/10 text-white border border-white/15 hover:bg-white/20 rounded-full font-semibold transition-all">
              {t('ctaBC')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
