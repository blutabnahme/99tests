"use client";

import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useTranslations } from "next-intl";
import { Check, User, ClipboardList, CheckCircle, ShieldCheck, BadgeCheck, FileText, History, Building2, Stethoscope } from "lucide-react";

export default function HowItWorksPage() {
 const t = useTranslations('howItWorks');
 return (
 <div className="font-body text-near-black bg-white overflow-x-hidden">
 <Navbar />

 {/* HERO SECTION */}
 {/* HERO SECTION */}
 <section className="pt-[100px] sm:pt-[140px] pb-14 sm:pb-24 lg:py-[100px] px-6 lg:px-12 bg-white">
 <div className="max-w-[1280px] mx-auto text-center">
 <span className="text-primary text-[13px] font-medium uppercase tracking-wide block mb-4">
 {t('heroBadge')}
 </span>
 <h1 className="font-heading text-[30px] sm:text-[36px] lg:text-[54px] font-medium text-near-black mb-5.5">
 {t('heroTitle')}
 </h1>
 <p className="text-[15px] sm:text-[17px] text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">
 {t('heroSubtitle')}
 </p>
 </div>
 </section>

 {/* THE FULL FLOW */}
 <section className="bg-white py-14 sm:py-20 lg:py-[100px] px-6 lg:px-12 relative overflow-hidden">
 <div className="max-w-[1280px] mx-auto relative lg:pl-[64px]">
 
 {/* Vertical Dashed Line connecting Steps - visible on desktop */}
 <div className="hidden lg:block absolute left-[24px] top-[40px] bottom-[40px] border-l border-dashed border-gray-200"></div>

 <div className="flex flex-col gap-0">
 
 {/* Step 1 */}
 <div className="py-8 sm:py-14 grid grid-cols-1 gap-8 sm:gap-12 items-center relative">
 <div className="hidden lg:flex absolute -left-[64px] top-[60px] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium items-center justify-center shadow-[0_0_0_8px_white] z-10">
 1
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
 <div className="order-2 lg:order-1">
 <div className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium flex items-center justify-center mb-4">
 1
 </div>
 <h2 className="text-[20px] sm:text-[24px] font-medium text-near-black">
 {t('step1Title')}
 </h2>
 <p className="text-[14px] sm:text-[15px] text-gray-500 mt-2 mb-3">
 {t('step1Desc')}
 </p>
 <ul className="space-y-2.5">
 {[
 t('step1Bul1'),
 t('step1Bul2'),
 t('step1Bul3'),
 t('step1Bul4')
 ].map((bullet, i) => (
 <li key={i} className="flex items-start gap-3">
 <Check className="w-4 h-4 text-[#008085] mt-0.5 shrink-0" strokeWidth={2.5} />
 <span className="text-[13px] sm:text-[14px] text-gray-500">{bullet}</span>
 </li>
 ))}
 </ul>
 </div>
 <div className="order-1 lg:order-2 h-[180px] sm:h-[240px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
 <span className="text-[14px] text-gray-400">{t('step1Preview')}</span>
 </div>
 </div>
 </div>

 {/* Step 2 */}
 <div className="py-8 sm:py-14 grid grid-cols-1 gap-8 sm:gap-12 items-center relative">
 <div className="hidden lg:flex absolute -left-[64px] top-[60px] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium items-center justify-center shadow-[0_0_0_8px_white] z-10">
 2
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
 <div className="order-1 h-[180px] sm:h-[240px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
 <span className="text-[14px] text-gray-400">{t('step2Preview')}</span>
 </div>
 <div className="order-2">
 <div className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium flex items-center justify-center mb-4">
 2
 </div>
 <h2 className="text-[20px] sm:text-[24px] font-medium text-near-black">
 {t('step2Title')}
 </h2>
 <p className="text-[14px] sm:text-[15px] text-gray-500 mt-2 mb-3">
 {t('step2Desc')}
 </p>
 <ul className="space-y-2.5">
 {[
 t('step2Bul1'),
 t('step2Bul2'),
 t('step2Bul3'),
 t('step2Bul4')
 ].map((bullet, i) => (
 <li key={i} className="flex items-start gap-3">
 <Check className="w-4 h-4 text-[#008085] mt-0.5 shrink-0" strokeWidth={2.5} />
 <span className="text-[13px] sm:text-[14px] text-gray-500">{bullet}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>

 {/* Step 3 */}
 <div className="py-8 sm:py-14 grid grid-cols-1 gap-8 sm:gap-12 items-center relative">
 <div className="hidden lg:flex absolute -left-[64px] top-[60px] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium items-center justify-center shadow-[0_0_0_8px_white] z-10">
 3
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
 <div className="order-2 lg:order-1">
 <div className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium flex items-center justify-center mb-4">
 3
 </div>
 <h2 className="text-[20px] sm:text-[24px] font-medium text-near-black">
 {t('step3Title')}
 </h2>
 <p className="text-[14px] sm:text-[15px] text-gray-500 mt-2 mb-3">
 {t('step3Desc')}
 </p>
 <ul className="space-y-2.5">
 {[
 t('step3Bul1'),
 t('step3Bul2'),
 t('step3Bul3'),
 t('step3Bul4')
 ].map((bullet, i) => (
 <li key={i} className="flex items-start gap-3">
 <Check className="w-4 h-4 text-[#008085] mt-0.5 shrink-0" strokeWidth={2.5} />
 <span className="text-[13px] sm:text-[14px] text-gray-500">{bullet}</span>
 </li>
 ))}
 </ul>
 </div>
 <div className="order-1 lg:order-2 h-[180px] sm:h-[240px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
 <span className="text-[14px] text-gray-400">{t('step3Preview')}</span>
 </div>
 </div>
 </div>

 {/* Step 4 */}
 <div className="py-8 sm:py-14 grid grid-cols-1 gap-8 sm:gap-12 items-center relative">
 <div className="hidden lg:flex absolute -left-[64px] top-[60px] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium items-center justify-center shadow-[0_0_0_8px_white] z-10">
 4
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
 <div className="order-1 h-[180px] sm:h-[240px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
 <span className="text-[14px] text-gray-400">{t('step4Preview')}</span>
 </div>
 <div className="order-2">
 <div className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium flex items-center justify-center mb-4">
 4
 </div>
 <h2 className="text-[20px] sm:text-[24px] font-medium text-near-black">
 {t('step4Title')}
 </h2>
 <p className="text-[14px] sm:text-[15px] text-gray-500 mt-2 mb-3">
 {t('step4Desc')}
 </p>
 <ul className="space-y-2.5">
 {[
 t('step4Bul1'),
 t('step4Bul2'),
 t('step4Bul3'),
 t('step4Bul4')
 ].map((bullet, i) => (
 <li key={i} className="flex items-start gap-3">
 <Check className="w-4 h-4 text-[#008085] mt-0.5 shrink-0" strokeWidth={2.5} />
 <span className="text-[13px] sm:text-[14px] text-gray-500">{bullet}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>

 {/* Step 5 */}
 <div className="py-8 sm:py-14 grid grid-cols-1 gap-8 sm:gap-12 items-center relative">
 <div className="hidden lg:flex absolute -left-[64px] top-[60px] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium items-center justify-center shadow-[0_0_0_8px_white] z-10">
 5
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
 <div className="order-2 lg:order-1">
 <div className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-medium flex items-center justify-center mb-4">
 5
 </div>
 <h2 className="text-[20px] sm:text-[24px] font-medium text-near-black">
 {t('step5Title')}
 </h2>
 <p className="text-[14px] sm:text-[15px] text-gray-500 mt-2 mb-3">
 {t('step5Desc')}
 </p>
 <ul className="space-y-2.5">
 {[
 t('step5Bul1'),
 t('step5Bul2'),
 t('step5Bul3'),
 t('step5Bul4')
 ].map((bullet, i) => (
 <li key={i} className="flex items-start gap-3">
 <Check className="w-4 h-4 text-[#008085] mt-0.5 shrink-0" strokeWidth={2.5} />
 <span className="text-[13px] sm:text-[14px] text-gray-500">{bullet}</span>
 </li>
 ))}
 </ul>
 </div>
 <div className="order-1 lg:order-2 h-[180px] sm:h-[240px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
 <span className="text-[14px] text-gray-400">{t('step5Preview')}</span>
 </div>
 </div>
 </div>

 </div>
 </div>
 </section>

 {/* MATCHING MODES SECTION */}
 <section className="bg-gray-50 py-14 sm:py-24 lg:py-[100px] px-6 lg:px-12">
 <div className="max-w-[1280px] mx-auto">
 <div className="mb-10 sm:mb-16 text-center">
 <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black">
 {t('modesTitle')}
 </h2>
 <p className="text-[15px] text-gray-500 mt-2 max-w-2xl mx-auto">
 {t('modesSubtitle')}
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
 <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6 lg:p-8 flex flex-col h-full hover:shadow-md transition-shadow">
 <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3 shrink-0">
 <User className="w-5 h-5 text-primary" />
 </div>
 <h3 className="text-[16px] sm:text-[18px] font-medium text-near-black mb-2">{t('mode1Title')}</h3>
 <p className="text-[13px] sm:text-[14px] text-gray-500 leading-relaxed flex-grow">
 {t('mode1Desc')}
 </p>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6 lg:p-8 flex flex-col h-full hover:shadow-md transition-shadow">
 <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3 shrink-0">
 <ClipboardList className="w-5 h-5 text-primary" />
 </div>
 <h3 className="text-[16px] sm:text-[18px] font-medium text-near-black mb-2">{t('mode2Title')}</h3>
 <p className="text-[13px] sm:text-[14px] text-gray-500 leading-relaxed flex-grow">
 {t('mode2Desc')}
 </p>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6 lg:p-8 flex flex-col h-full hover:shadow-md transition-shadow">
 <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3 shrink-0">
 <CheckCircle className="w-5 h-5 text-primary" />
 </div>
 <h3 className="text-[16px] sm:text-[18px] font-medium text-near-black mb-2">{t('mode3Title')}</h3>
 <p className="text-[13px] sm:text-[14px] text-gray-500 leading-relaxed flex-grow">
 {t('mode3Desc')}
 </p>
 </div>
 </div>
 </div>
 </section>

 {/* TRUST & SAFETY SECTION */}
 <section className="bg-white py-14 sm:py-24 lg:py-[100px] px-6 lg:px-12 border-b border-gray-100">
 <div className="max-w-[1280px] mx-auto">
 <div className="mb-10 sm:mb-16 text-center">
 <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black">
 {t('trustTitle')}
 </h2>
 <p className="text-[15px] text-gray-500 mt-2 max-w-2xl mx-auto">
 {t('trustSubtitle')}
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-sm hover:border-gray-300 transition-colors">
 <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center mb-3">
 <ShieldCheck className="w-5 h-5 text-gray-600" />
 </div>
 <h3 className="text-[15px] font-medium text-near-black mb-1">{t('trust1Title')}</h3>
 <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed">
 {t('trust1Desc')}
 </p>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-sm hover:border-gray-300 transition-colors">
 <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center mb-3">
 <BadgeCheck className="w-5 h-5 text-gray-600" />
 </div>
 <h3 className="text-[15px] font-medium text-near-black mb-1">{t('trust2Title')}</h3>
 <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed">
 {t('trust2Desc')}
 </p>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-sm hover:border-gray-300 transition-colors">
 <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center mb-3">
 <FileText className="w-5 h-5 text-gray-600" />
 </div>
 <h3 className="text-[15px] font-medium text-near-black mb-1">{t('trust3Title')}</h3>
 <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed">
 {t('trust3Desc')}
 </p>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-sm hover:border-gray-300 transition-colors">
 <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center mb-3">
 <History className="w-5 h-5 text-gray-600" />
 </div>
 <h3 className="text-[15px] font-medium text-near-black mb-1">{t('trust4Title')}</h3>
 <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed">
 {t('trust4Desc')}
 </p>
 </div>
 </div>
 </div>
 </section>

 {/* CTA SECTION */}
 <section className="bg-white py-14 sm:py-24 lg:py-[100px] px-6 lg:px-12">
 <div className="max-w-[1280px] mx-auto text-center">
 <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black mb-10">
 {t('ctaTitle')}
 </h2>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
 <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 lg:p-10 text-center hover:shadow-lg hover:border-primary/20 transition-colors duration-200 flex flex-col items-center">
 <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shrink-0">
 <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
 </div>
 <h3 className="text-[18px] font-medium text-near-black mb-2">{t('ctaHcTitle')}</h3>
 <p className="text-[14px] text-gray-500 leading-relaxed mb-6 max-w-[240px]">
 {t('ctaHcDesc')}
 </p>
 <div className="flex flex-col sm:flex-row gap-3 mt-auto justify-center">
 <Link href="/register/hc" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-primary hover:bg-primary-dark text-white rounded-full font-semibold shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] transition-colors">
 {t('ctaHcBtn')}
 </Link>
 </div>
 </div>

 <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 lg:p-10 text-center hover:shadow-lg hover:border-primary/20 transition-colors duration-200 flex flex-col items-center">
 <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-4 shrink-0">
 <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 text-[#008085]" />
 </div>
 <h3 className="text-[18px] font-medium text-near-black mb-2">{t('ctaBcTitle')}</h3>
 <p className="text-[14px] text-gray-500 leading-relaxed mb-6 max-w-[240px]">
 {t('ctaBcDesc')}
 </p>
 <Link href="/register/bc" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-transparent border-[1.5px] border-primary text-primary hover:bg-primary hover:text-white rounded-full font-semibold transition-colors mt-auto">
 {t('ctaBcBtn')}
 </Link>
 </div>
 </div>
 </div>
 </section>

 <Footer />
 </div>
 );
}
