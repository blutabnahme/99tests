"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

export default function ContactPage() {
 const t = useTranslations('contact');
 const [isSubmitted, setIsSubmitted] = useState(false);

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

 {/* TWO-COLUMN LAYOUT */}
 <section className="bg-white pb-14 sm:pb-24 px-6 lg:px-12">
 <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
 
 {/* CONTACT FORM (Left) */}
 <div className="lg:col-span-3">
 <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
 {isSubmitted ? (
 <div className="flex flex-col items-center justify-center py-12 text-center h-full">
 <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
 <CheckCircle2 className="w-8 h-8 text-green-500" strokeWidth={2.5} />
 </div>
 <h3 className="text-[20px] font-medium text-near-black mb-2">{t('successTitle')}</h3>
 <p className="text-[15px] text-gray-500 leading-relaxed max-w-sm mb-6">
 {t('successDesc')}
 </p>
 <button 
 onClick={() => setIsSubmitted(false)}
 className="text-[14px] font-medium text-primary hover:text-primary-dark transition-colors"
 >
 {t('successBtn')}
 </button>
 </div>
 ) : (
 <form 
 onSubmit={(e) => {
 e.preventDefault();
 setIsSubmitted(true);
 }} 
 className="space-y-5"
 >
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <div>
 <label htmlFor="name" className="text-[13px] font-medium text-gray-700 mb-1.5 block">
 {t('formName')}
 </label>
 <input 
 type="text" 
 id="name" 
 required
 placeholder={t('formNamePlaceholder')}
 className="w-full h-10 rounded-full border border-gray-200 px-4 text-[14px] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-colors"
 />
 </div>
 <div>
 <label htmlFor="email" className="text-[13px] font-medium text-gray-700 mb-1.5 block">
 {t('formEmail')}
 </label>
 <input 
 type="email" 
 id="email" 
 required
 placeholder={t('formEmailPlaceholder')}
 className="w-full h-10 rounded-full border border-gray-200 px-4 text-[14px] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-colors"
 />
 </div>
 </div>

 <div>
 <label htmlFor="company" className="text-[13px] font-medium text-gray-700 mb-1.5 block">
 {t('formCompany')}
 </label>
 <input 
 type="text" 
 id="company" 
 placeholder={t('formCompanyPlaceholder')}
 className="w-full h-10 rounded-full border border-gray-200 px-4 text-[14px] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-colors"
 />
 </div>

 <div>
 <label htmlFor="subject" className="text-[13px] font-medium text-gray-700 mb-1.5 block">
 {t('formSubject')}
 </label>
 <select 
 id="subject"
 required
 defaultValue=""
 className="w-full h-10 rounded-full border border-gray-200 px-4 text-[14px] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-colors bg-white appearance-none"
 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 16px center`, backgroundRepeat: `no-repeat`, backgroundSize: `16px` }}
 >
 <option value="" disabled>{t('formSubjectSelect')}</option>
 <option value={t('formSubject1')}>{t('formSubject1')}</option>
 <option value={t('formSubject2')}>{t('formSubject2')}</option>
 <option value={t('formSubject3')}>{t('formSubject3')}</option>
 <option value={t('formSubject4')}>{t('formSubject4')}</option>
 <option value={t('formSubject5')}>{t('formSubject5')}</option>
 <option value={t('formSubject6')}>{t('formSubject6')}</option>
 </select>
 </div>

 <div>
 <label htmlFor="message" className="text-[13px] font-medium text-gray-700 mb-1.5 block">
 {t('formMessage')}
 </label>
 <textarea 
 id="message" 
 required
 placeholder={t('formMessagePlaceholder')}
 className="w-full rounded-lg border border-gray-200 px-4 py-3 text-[14px] h-32 resize-none placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-colors"
 ></textarea>
 </div>

 <button 
 type="submit"
 className="flex items-center justify-center px-7 py-3 text-[15px] bg-primary hover:bg-primary-dark text-white rounded-full font-semibold shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] transition-colors w-full sm:w-auto mt-4"
 >
 {t('formSubmit')}
 </button>
 </form>
 )}
 </div>
 </div>

 {/* CONTACT INFO (Right) */}
 <div className="lg:col-span-2">
 <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
 <div className="mb-6 last:mb-0">
 <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-1">{t('infoEmail')}</div>
 <div className="text-[15px] text-near-black">
 <a href="mailto:contact@99tests.com" className="text-primary hover:underline font-medium">
 contact@99tests.com
 </a>
 </div>
 </div>
 <div className="mb-6 last:mb-0">
 <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-1">{t('infoResponse')}</div>
 <div className="text-[15px] text-near-black">
 {t('infoResponseDesc')}
 </div>
 </div>
 <div className="mb-6 last:mb-0">
 <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-1">{t('infoHours')}</div>
 <div className="text-[15px] text-near-black">
 {t('infoHoursDesc')}
 </div>
 </div>
 <div className="mb-6">
 <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-1">{t('infoLocation')}</div>
 <div className="text-[15px] text-near-black">
 {t('infoLocationDesc')}
 </div>
 </div>
 
 <div className="mt-8 pt-8 border-t border-gray-200">
 <p className="text-[14px] text-gray-500 leading-relaxed">
 {t('infoDesc')}
 </p>
 </div>
 </div>
 </div>

 </div>
 </section>

 {/* FAQ MINI SECTION */}
 <section className="bg-white py-14 sm:py-20 lg:py-[100px] px-6 lg:px-12 border-t border-gray-100">
 <div className="max-w-[1280px] mx-auto">
 <div className="mb-10 text-center">
 <h2 className="font-heading text-[24px] sm:text-[32px] font-medium text-near-black">
 {t('faqTitle')}
 </h2>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
 <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
 <h3 className="text-[15px] font-medium text-near-black mb-2">{t('faq1Q')}</h3>
 <p className="text-[14px] text-gray-500 leading-relaxed">
 {t('faq1A')}
 </p>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
 <h3 className="text-[15px] font-medium text-near-black mb-2">{t('faq2Q')}</h3>
 <p className="text-[14px] text-gray-500 leading-relaxed">
 {t('faq2A')}
 </p>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
 <h3 className="text-[15px] font-medium text-near-black mb-2">{t('faq3Q')}</h3>
 <p className="text-[14px] text-gray-500 leading-relaxed">
 {t('faq3A')}
 </p>
 </div>
 </div>
 </div>
 </section>

 <Footer />
 </div>
 );
}
