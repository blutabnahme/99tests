"use client";

import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useTranslations } from "next-intl";
import { Check, Calendar, ShieldCheck, Star, DollarSign, ArrowRight, Search, CalendarClock, CreditCard, Quote } from "lucide-react";

export default function ForProfessionalsPage() {
  const t = useTranslations('forProfessionals');
  return (
    <div className="font-body text-near-black bg-gray-50 overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="bg-white pt-[100px] sm:pt-[130px] lg:pt-[140px] pb-12 sm:pb-16 lg:pb-20 px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-[0.02] mix-blend-overlay"></div>
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-12 items-center relative z-10">
          <div className="flex-1 w-full">
            <span className="text-primary text-[13px] font-medium uppercase tracking-wide block mb-4">
              {t('heroBadge')}
            </span>
            <h1 className="font-heading text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.15] sm:leading-[1.2] tracking-tight font-medium text-near-black mb-5.5">
              {t('heroTitle1')}<br />{t('heroTitle2')}<br /><span className="text-primary italic">{t('heroTitle3')}</span>
            </h1>
            <p className="text-[15px] sm:text-[16px] lg:text-[17px] text-gray-500 mt-4 max-w-[480px] leading-relaxed">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register/bc" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-primary hover:bg-[#157575] text-white rounded-full font-semibold hover:-translate-y-[1px] transition-all shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] flex-shrink-0">
                {t('heroCtaPrimary')}
              </Link>
              <Link href="#how-it-works" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-transparent border-[1.5px] border-primary text-primary hover:bg-primary hover:text-white rounded-full font-semibold transition-all flex-shrink-0">
                {t('heroCtaSecondary')}
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full bg-gray-100 rounded-2xl h-[300px] sm:h-[380px] flex items-center justify-center border border-gray-200">
            <div className="text-center text-gray-400">
              <span className="text-[14px]">{t('heroPreviewCard')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="bg-gray-50 py-14 sm:py-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 sm:mb-16">
            <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black text-center">
              {t('benefitsTitle')}
            </h2>
            <p className="text-[15px] text-gray-500 text-center mt-2 max-w-2xl mx-auto">
              {t('benefitsSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-gray-300 hover:bg-gradient-to-br hover:from-white hover:to-teal-50/40 transition-all duration-300 flex flex-col h-full group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <DollarSign className="w-5 h-5 text-[#008085]" />
              </div>
              <h3 className="text-[17px] font-medium text-near-black mb-1.5">{t('benefit1Title')}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed flex-grow">
                {t('benefit1Desc')}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-gray-300 hover:bg-gradient-to-br hover:from-white hover:to-teal-50/40 transition-all duration-300 flex flex-col h-full group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Calendar className="w-5 h-5 text-[#008085]" />
              </div>
              <h3 className="text-[17px] font-medium text-near-black mb-1.5">{t('benefit2Title')}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed flex-grow">
                {t('benefit2Desc')}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-gray-300 hover:bg-gradient-to-br hover:from-white hover:to-teal-50/40 transition-all duration-300 flex flex-col h-full group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <ShieldCheck className="w-5 h-5 text-[#008085]" />
              </div>
              <h3 className="text-[17px] font-medium text-near-black mb-1.5">{t('benefit3Title')}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed flex-grow">
                {t('benefit3Desc')}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-gray-300 hover:bg-gradient-to-br hover:from-white hover:to-teal-50/40 transition-all duration-300 flex flex-col h-full group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Star className="w-5 h-5 text-[#008085]" />
              </div>
              <h3 className="text-[17px] font-medium text-near-black mb-1.5">{t('benefit4Title')}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed flex-grow">
                {t('benefit4Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white py-14 sm:py-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 sm:mb-16">
            <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black text-center">
              {t('howTitle')}
            </h2>
            <p className="text-[15px] text-gray-500 text-center mt-2 max-w-2xl mx-auto">
              {t('howSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {[
              { num: 1, title: t('how1Title'), desc: t('how1Desc'), icon: Search },
              { num: 2, title: t('how2Title'), desc: t('how2Desc'), icon: CalendarClock },
              { num: 3, title: t('how3Title'), desc: t('how3Desc'), icon: CreditCard }
            ].map((step, i) => {
              const Icon = step.icon;
              return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="w-10 h-10 rounded-full bg-primary text-white text-[15px] font-medium flex items-center justify-center mb-5 shrink-0 shadow-sm border-[3px] border-red-50">
                  {step.num}
                </div>
                <div className="h-[140px] bg-gray-50 rounded-lg mb-6 flex flex-col items-center justify-center border border-gray-100 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent"></div>
                  <Icon className="w-12 h-12 text-gray-300 mb-3 group-hover:scale-110 group-hover:text-[#008085]/40 transition-all duration-500" strokeWidth={1.5} />
                  <span className="text-[11px] font-medium text-gray-400 tracking-wider uppercase">{t('howStepPreview')}</span>
                </div>
                <h3 className="text-[17px] font-medium text-near-black mb-2">{step.title}</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed flex-grow">
                  {step.desc}
                </p>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-near-black py-12 sm:py-20 px-6 lg:px-12 border-y border-white/5 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12 relative z-10">
          {[
            { num: "2,400+", label: t('statLabel1') },
            { num: "€35", label: t('statLabel2') },
            { num: "4.8★", label: t('statLabel3') },
            { num: "48hr", label: t('statLabel4') },
          ].map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="font-heading text-[26px] sm:text-[32px] lg:text-[42px] font-medium text-white leading-tight mb-1 group-hover:scale-105 transition-transform duration-300">{stat.num}</div>
              <div className="text-[11px] sm:text-[13px] text-white/60 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL SECTION */}
      <section className="bg-white py-14 sm:py-24 px-6 lg:px-12 border-y border-gray-200/60">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 sm:p-14 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <Quote className="absolute top-6 left-6 sm:top-8 sm:left-8 w-16 h-16 text-primary/[0.08] rotate-180" />
          <h3 className="text-[16px] sm:text-[18px] text-near-black leading-relaxed italic relative z-10 mb-8 max-w-2xl mx-auto">
            "{t('testimonialQuote')}"
          </h3>
          <div className="flex items-center justify-center gap-4 mt-4 not-italic">
            <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
              <span className="text-[16px] font-medium text-gray-500">M</span>
            </div>
            <div className="text-left">
              <p className="text-[15px] font-medium text-near-black tracking-wide">{t('testimonialName')}</p>
              <p className="text-[14px] text-gray-500">{t('testimonialRole')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* EARNINGS SECTION */}
      <section className="bg-gray-50 py-14 sm:py-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 sm:mb-16">
            <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black text-center">
              {t('earningsTitle')}
            </h2>
            <p className="text-[15px] text-gray-500 text-center mt-2 max-w-2xl mx-auto">
              {t('earningsSubtitle')}
            </p>
          </div>
          
          <div className="bg-teal-50/80 rounded-xl p-5 text-center mb-8 max-w-lg mx-auto border border-teal-100">
            <span className="text-[18px] sm:text-[20px] font-medium text-[#008085]">{t('earningsBadge')}</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-8 max-w-lg mx-auto shadow-sm">
            <div className="flex justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-100">
              <span className="text-[13px] sm:text-[14px] text-gray-500">{t('earningsItem1')}</span>
              <span className="text-[14px] sm:text-[15px] font-medium font-mono text-near-black">€25 — €45</span>
            </div>
            <div className="flex justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-100">
              <span className="text-[13px] sm:text-[14px] text-gray-500">{t('earningsItem2')}</span>
              <span className="text-[14px] sm:text-[15px] font-medium font-mono text-near-black">€35 — €65</span>
            </div>
            <div className="flex justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-100">
              <span className="text-[13px] sm:text-[14px] text-gray-500">{t('earningsItem3')}</span>
              <span className="text-[14px] sm:text-[15px] font-medium font-mono text-near-black">€0.40/km</span>
            </div>
            <div className="flex justify-between px-3 py-2 sm:px-4 sm:py-3 pt-4 border-t border-gray-100/50 mt-1">
              <span className="text-[13px] sm:text-[14px] text-gray-500">{t('earningsItem4')}</span>
              <span className="text-[14px] sm:text-[15px] font-medium font-mono text-near-black">17.5%</span>
            </div>
          </div>
          <p className="text-[13px] text-gray-400 text-center mt-6">
            {t('earningsNote')}
          </p>
        </div>
      </section>

      {/* REQUIREMENTS SECTION */}
      <section className="bg-white py-14 sm:py-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 sm:mb-16">
            <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black text-center">
              {t('reqsTitle')}
            </h2>
            <p className="text-[15px] text-gray-500 text-center mt-2 max-w-2xl mx-auto">
              {t('reqsSubtitle')}
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-8 max-w-xl mx-auto shadow-sm">
            <h3 className="text-[16px] font-medium text-near-black mb-4">{t('reqsChecklistTitle')}</h3>
            <div className="flex flex-col">
              {[
                t('req1'),
                t('req2'),
                t('req3'),
                t('req4'),
                t('req5')
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
                  <Check className="w-5 h-5 text-[#008085] shrink-0" strokeWidth={2.5} />
                  <span className="text-[14px] sm:text-[15px] text-gray-600">{req}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[13px] text-gray-400 text-center mt-4">
            {t('reqsNote')}
          </p>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-primary py-14 sm:py-24 px-6 lg:px-12 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-[800px] mx-auto relative z-10">
          <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-white tracking-tight">
            {t('ctaTitle')}
          </h2>
          <p className="text-[15px] sm:text-[16px] text-white/80 mt-3 max-w-lg mx-auto">
            {t('ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10">
            <Link href="/register/bc" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-white text-primary rounded-full font-semibold shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:bg-gray-50 hover:-translate-y-[1px] transition-all">
              {t('ctaPrimary')}
            </Link>
            <Link href="/contact" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-white/10 text-white border border-white/15 hover:bg-white/20 rounded-full font-semibold transition-all">
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
