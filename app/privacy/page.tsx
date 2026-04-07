import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useTranslations } from "next-intl";

export default function PrivacyPage() {
 const t = useTranslations('privacy');

 return (
 <div className="font-body text-near-black bg-gray-50 min-h-screen flex flex-col overflow-x-hidden">
 <Navbar />

 {/* HERO */}
 <section className="pt-[100px] sm:pt-[140px] pb-8 sm:pb-12 px-6 lg:px-12 text-center flex-shrink-0">
 <div className="max-w-[1280px] mx-auto">
 <span className="text-primary text-[13px] font-medium uppercase tracking-wide block mb-4">
 {t('heroBadge')}
 </span>
 <h1 className="font-heading text-[30px] sm:text-[36px] lg:text-[54px] font-medium text-near-black mb-2">
 {t('heroTitle')}
 </h1>
 <p className="text-[14px] text-gray-400 mt-2">
 {t('lastUpdated')}
 </p>
 </div>
 </section>

 {/* CONTENT */}
 <section className="flex-grow pb-14 sm:pb-24 px-6 lg:px-12">
 <div className="max-w-3xl mx-auto w-full">
 
 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-[13px] text-yellow-700 shadow-sm leading-relaxed">
 <strong>{t('note').split(':')[0]}:</strong> {t('note').split(':').slice(1).join(':').trim()}
 </div>

 <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 lg:p-10 shadow-sm">
 
 {/* TABLE OF CONTENTS */}
 <div className="bg-gray-50 rounded-lg p-5 mb-10 border border-gray-100">
 <h2 className="text-[14px] font-medium text-near-black mb-3">{t('contents')}</h2>
 <nav className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
 <a href="#introduction" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav1')}</a>
 <a href="#data-controller" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav2')}</a>
 <a href="#data-we-collect" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav3')}</a>
 <a href="#how-we-use-your-data" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav4')}</a>
 <a href="#legal-basis-for-processing" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav5')}</a>
 <a href="#data-sharing" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav6')}</a>
 <a href="#data-retention" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav7')}</a>
 <a href="#your-rights" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav8')}</a>
 <a href="#cookies" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav9')}</a>
 <a href="#data-security" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav10')}</a>
 <a href="#international-transfers" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav11')}</a>
 <a href="#changes-to-this-policy" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav12')}</a>
 <a href="#contact" className="text-[13px] text-primary hover:underline block py-1.5">{t('nav13')}</a>
 </nav>
 </div>

 {/* SECTIONS */}
 <div className="space-y-8">
 <div>
 <h3 id="introduction" className="text-[18px] font-medium text-near-black mb-3 scroll-mt-24">{t('nav1')}</h3>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('p1')}
 </p>
 </div>

 <div>
 <h3 id="data-controller" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav2')}</h3>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('p2a')}<br/>
 {t('p2b')}<br/>
 {t('p2c')} <a href="mailto:privacy@99tests.com" className="text-primary hover:underline">privacy@99tests.com</a>
 </p>
 </div>

 <div>
 <h3 id="data-we-collect" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav3')}</h3>
 <ul className="list-disc pl-5 space-y-2 text-[14px] text-gray-600 leading-relaxed">
 <li>{t('l3a')}</li>
 <li>{t('l3b')}</li>
 <li>{t('l3c')}</li>
 <li>{t('l3d')}</li>
 <li>{t('l3e')}</li>
 <li>{t('l3f')}</li>
 </ul>
 </div>

 <div>
 <h3 id="how-we-use-your-data" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav4')}</h3>
 <ul className="list-disc pl-5 space-y-2 text-[14px] text-gray-600 leading-relaxed">
 <li>{t('l4a')}</li>
 <li>{t('l4b')}</li>
 <li>{t('l4c')}</li>
 <li>{t('l4d')}</li>
 <li>{t('l4e')}</li>
 <li>{t('l4f')}</li>
 <li>{t('l4g')}</li>
 </ul>
 </div>

 <div>
 <h3 id="legal-basis-for-processing" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav5')}</h3>
 <ul className="list-disc pl-5 space-y-2 text-[14px] text-gray-600 leading-relaxed">
 <li>{t('l5a')}</li>
 <li>{t('l5b')}</li>
 <li>{t('l5c')}</li>
 <li>{t('l5d')}</li>
 </ul>
 </div>

 <div>
 <h3 id="data-sharing" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav6')}</h3>
 <p className="text-[14px] text-gray-600 leading-relaxed mb-3">
 {t('p6')}
 </p>
 <ul className="list-disc pl-5 space-y-2 text-[14px] text-gray-600 leading-relaxed">
 <li>{t('l6a')}</li>
 <li>{t('l6b')}</li>
 <li>{t('l6c')}</li>
 <li>{t('l6d')}</li>
 <li>{t('l6e')}</li>
 </ul>
 </div>

 <div>
 <h3 id="data-retention" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav7')}</h3>
 <ul className="list-disc pl-5 space-y-2 text-[14px] text-gray-600 leading-relaxed">
 <li>{t('l7a')}</li>
 <li>{t('l7b')}</li>
 <li>{t('l7c')}</li>
 <li>{t('l7d')}</li>
 </ul>
 </div>

 <div>
 <h3 id="your-rights" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav8')}</h3>
 <p className="text-[14px] text-gray-600 leading-relaxed mb-3">
 {t('p8a')}
 </p>
 <ul className="list-disc pl-5 space-y-2 text-[14px] text-gray-600 leading-relaxed mb-4">
 <li>{t('l8a')}</li>
 <li>{t('l8b')}</li>
 <li>{t('l8c')}</li>
 <li>{t('l8d')}</li>
 <li>{t('l8e')}</li>
 <li>{t('l8f')}</li>
 <li>{t('l8g')}</li>
 </ul>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('p8b')} <a href="mailto:privacy@99tests.com" className="text-primary hover:underline">privacy@99tests.com</a>
 </p>
 </div>

 <div>
 <h3 id="cookies" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav9')}</h3>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('p9')}
 </p>
 </div>

 <div>
 <h3 id="data-security" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav10')}</h3>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('p10')}
 </p>
 </div>

 <div>
 <h3 id="international-transfers" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav11')}</h3>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('p11')}
 </p>
 </div>

 <div>
 <h3 id="changes-to-this-policy" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav12')}</h3>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('p12')}
 </p>
 </div>

 <div>
 <h3 id="contact" className="text-[18px] font-medium text-near-black mb-3 mt-8 scroll-mt-24">{t('nav13')}</h3>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('p13')}<br/>
 99Tests GmbH, <a href="mailto:privacy@99tests.com" className="text-primary hover:underline">privacy@99tests.com</a>, Musterstraße 1, 60311 Frankfurt am Main
 </p>
 </div>
 </div>
 </div>
 </div>
 </section>

 <div className="mt-auto">
 <Footer />
 </div>
 </div>
 );
}
