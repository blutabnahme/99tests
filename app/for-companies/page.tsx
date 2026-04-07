"use client";

import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useTranslations } from "next-intl";
import { PhoneOff, ShieldAlert, EyeOff, CheckCircle2, Building2, ShieldCheck, Activity, Users, Settings, CreditCard } from "lucide-react";

export default function ForCompaniesPage() {
 const t = useTranslations('forCompanies');
 return (
 <div className="font-body text-near-black bg-gray-50 overflow-x-hidden">
 <Navbar />

 {/* HERO SECTION */}
 <section className="bg-white pt-[100px] sm:pt-[140px] pb-12 sm:pb-20 px-6 lg:px-12">
 <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
 <div>
 <span className="text-primary text-[13px] font-semibold uppercase tracking-wide block mb-4">
 {t('heroBadge')}
 </span>
 <h1 className="font-heading text-[30px] sm:text-[36px] lg:text-[52px] font-medium text-near-black tracking-tight leading-[1.1]">
 {t('heroTitle1')}<br />{t('heroTitle2')}
 </h1>
 <p className="text-[15px] sm:text-[17px] text-gray-500 mt-4 max-w-lg leading-relaxed">
 {t('heroSubtitle')}
 </p>
 <div className="mt-8 flex flex-col sm:flex-row gap-3">
 <Link href="/register/hc" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-primary hover:bg-primary-dark text-white rounded-full font-semibold shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] transition-colors flex-shrink-0">
 {t('heroCtaPrimary')}
 </Link>
 <Link href="#how-it-works" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-transparent border-[1.5px] border-primary text-primary hover:bg-primary hover:text-white rounded-full font-semibold transition-colors flex-shrink-0">
 {t('heroCtaSecondary')}
 </Link>
 </div>
 </div>
 <div className="bg-gray-100 rounded-2xl h-[300px] sm:h-[400px] w-full flex items-center justify-center border border-gray-200">
 <div className="text-center text-gray-400">
 <Building2 className="w-16 h-16 mx-auto mb-3 opacity-50" />
 <span className="text-[14px]">{t('heroPreviewCard')}</span>
 </div>
 </div>
 </div>
 </section>

 {/* PAIN POINTS SECTION */}
 <section className="bg-gray-50 py-14 sm:py-24 px-6 lg:px-12">
 <div className="max-w-[1280px] mx-auto">
 <div className="mb-10 sm:mb-16">
 <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black text-center">
 {t('painTitle')}
 </h2>
 <p className="text-[15px] text-gray-500 text-center mt-2 max-w-2xl mx-auto">
 {t('painSubtitle')}
 </p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-colors duration-200">
 <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
 <PhoneOff className="w-5 h-5 text-primary" />
 </div>
 <h3 className="font-heading text-[16px] font-medium text-near-black mb-2">{t('pain1Title')}</h3>
 <p className="text-[14px] text-gray-500 leading-relaxed">
 {t('pain1Desc')}
 </p>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-colors duration-200">
 <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
 <ShieldAlert className="w-5 h-5 text-primary" />
 </div>
 <h3 className="font-heading text-[16px] font-medium text-near-black mb-2">{t('pain2Title')}</h3>
 <p className="text-[14px] text-gray-500 leading-relaxed">
 {t('pain2Desc')}
 </p>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-colors duration-200">
 <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
 <EyeOff className="w-5 h-5 text-primary" />
 </div>
 <h3 className="font-heading text-[16px] font-medium text-near-black mb-2">{t('pain3Title')}</h3>
 <p className="text-[14px] text-gray-500 leading-relaxed">
 {t('pain3Desc')}
 </p>
 </div>
 </div>
 </div>
 </section>

 {/* SOLUTION SECTION */}
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
 
 <div className="space-y-12 sm:space-y-16">
 {[
 { num: 1, title: t('how1Title'), desc: t('how1Desc') },
 { num: 2, title: t('how2Title'), desc: t('how2Desc') },
 { num: 3, title: t('how3Title'), desc: t('how3Desc') },
 { num: 4, title: t('how4Title'), desc: t('how4Desc') },
 ].map((step, i) => (
 <div key={i} className={`flex flex-col gap-10 sm:gap-16 items-center ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
 <div className="flex-1 w-full lg:w-1/2">
 <div className="flex items-start gap-4">
 <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-medium text-[14px] shrink-0 mt-1 shadow-md">
 {step.num}
 </div>
 <div>
 <h3 className="font-heading text-[18px] sm:text-[20px] md:text-[24px] font-medium text-near-black mb-3">{step.title}</h3>
 <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed max-w-md">{step.desc}</p>
 </div>
 </div>
 </div>
 <div className="flex-1 w-full lg:w-1/2">
 <div className="bg-gray-100 rounded-2xl h-[260px] sm:h-[300px] w-full flex items-center justify-center shadow-inner border border-gray-200">
 <div className="text-gray-400 flex flex-col items-center">
 <CheckCircle2 className="w-12 h-12 mb-2 opacity-40" />
 <span className="text-[13px] font-medium">{t('howStepPreview', { step: step.num })}</span>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* FEATURES GRID */}
 <section className="bg-gray-50 py-14 sm:py-24 px-6 lg:px-12">
 <div className="max-w-[1280px] mx-auto">
 <div className="mb-10 sm:mb-16">
 <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-near-black text-center">
 {t('featuresTitle')}
 </h2>
 <p className="text-[15px] text-gray-500 text-center mt-2 max-w-2xl mx-auto">
 {t('featuresSubtitle')}
 </p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {[
 { icon: ShieldCheck, title: t('feature1Title'), desc: t('feature1Desc') },
 { icon: Building2, title: t('feature2Title'), desc: t('feature2Desc') },
 { icon: ShieldAlert, title: t('feature3Title'), desc: t('feature3Desc') },
 { icon: Activity, title: t('feature4Title'), desc: t('feature4Desc') },
 { icon: Users, title: t('feature5Title'), desc: t('feature5Desc') },
 { icon: CreditCard, title: t('feature6Title'), desc: t('feature6Desc') },
 ].map((feature, i) => {
 const Icon = feature.icon;
 return (
 <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-colors duration-200">
 <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
 <Icon className="w-5 h-5 text-primary" />
 </div>
 <h3 className="font-heading text-[15px] font-medium text-near-black mb-1">{feature.title}</h3>
 <p className="text-[13px] text-gray-500 leading-relaxed">{feature.desc}</p>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* SOCIAL PROOF / NUMBERS */}
 <section className="bg-near-black py-12 sm:py-20 px-6 lg:px-12 relative overflow-hidden">
 <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
 <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
 <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12 relative z-10">
 {[
 { num: "2,400+", label: t('statLabel1') },
 { num: "15,000+", label: t('statLabel2') },
 { num: "98.5%", label: t('statLabel3') },
 { num: "250+", label: t('statLabel4') },
 ].map((stat, i) => (
 <div key={i} className="text-center">
 <div className="font-heading text-[26px] sm:text-[32px] lg:text-[40px] font-medium text-white leading-[1.1]">{stat.num}</div>
 <div className="text-[12px] sm:text-[13px] text-white/70 uppercase tracking-wide mt-1">{stat.label}</div>
 </div>
 ))}
 </div>
 </section>

 {/* CTA SECTION */}
 <section className="bg-gradient-to-br from-[#008085] to-[#8a1528] py-14 sm:py-24 px-6 lg:px-12 text-center text-white relative overflow-hidden">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-10 mix-blend-overlay"></div>
 <div className="max-w-[800px] mx-auto relative z-10">
 <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[36px] font-medium text-white tracking-tight">
 {t('ctaTitle')}
 </h2>
 <p className="text-[15px] sm:text-[16px] text-white/80 mt-3 max-w-lg mx-auto">
 {t('ctaDesc')}
 </p>
 <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
 <Link href="/register/hc" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-white text-primary rounded-full font-semibold hover:bg-gray-50 shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] transition-colors">
 {t('ctaRegister')}
 </Link>
 <Link href="/contact" className="w-full sm:w-auto flex items-center justify-center px-7 py-3 text-[15px] bg-white/10 text-white border border-white/15 hover:bg-white/20 rounded-full font-semibold transition-colors">
 {t('ctaContact')}
 </Link>
 </div>
 </div>
 </section>

 <Footer />
 </div>
 );
}
