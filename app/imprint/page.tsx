import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useTranslations } from "next-intl";

export default function ImprintPage() {
 const t = useTranslations('imprint');

 return (
 <div className="font-body text-near-black bg-gray-50 min-h-screen flex flex-col overflow-x-hidden">
 <Navbar />

 {/* HERO */}
 <section className="pt-[100px] sm:pt-[140px] pb-8 sm:pb-12 px-6 lg:px-12 text-center flex-shrink-0">
 <div className="max-w-[1280px] mx-auto">
 <span className="text-primary text-[13px] font-medium uppercase tracking-wide block mb-4">
 {t('heroBadge')}
 </span>
 <h1 className="font-heading text-[30px] sm:text-[36px] lg:text-[54px] font-medium text-near-black mb-5.5">
 {t('heroTitle')}
 </h1>
 </div>
 </section>

 {/* CONTENT */}
 <section className="flex-grow pb-14 sm:pb-24 px-6 lg:px-12">
 <div className="max-w-2xl mx-auto w-full">
 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-[13px] text-yellow-700 leading-relaxed shadow-sm">
 <strong>{t('note').split(':')[0]}:</strong> {t('note').split(':').slice(1).join(':').trim()}
 </div>

 <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 shadow-sm">
 <div className="mb-8">
 <h2 className="text-[18px] font-medium text-near-black mb-3">{t('section1Title')}</h2>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 99Tests GmbH (i.Gr.)<br />
 Musterstraße 1<br />
 60311 Frankfurt am Main<br />
 Germany
 </p>
 </div>

 <div className="mb-8">
 <h2 className="text-[18px] font-medium text-near-black mb-3">{t('section2Title')}</h2>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 [Managing Director Name]
 </p>
 </div>

 <div className="mb-8">
 <h2 className="text-[18px] font-medium text-near-black mb-3">{t('section3Title')}</h2>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 Email: <a href="mailto:contact@99tests.com" className="text-primary hover:underline">contact@99tests.com</a><br />
 Phone: +49 (0) 69 XXXXXXXX
 </p>
 </div>

 <div className="mb-8">
 <h2 className="text-[18px] font-medium text-near-black mb-3">{t('section4Title')}</h2>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('section4Text1')}<br />
 {t('section4Text2')}
 </p>
 </div>

 <div className="mb-8">
 <h2 className="text-[18px] font-medium text-near-black mb-3">{t('section5Title')}</h2>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('section5Text1')}<br />
 {t('section5Text2')}
 </p>
 </div>

 <div className="mb-8">
 <h2 className="text-[18px] font-medium text-near-black mb-3">{t('section6Title')}</h2>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 [Name]<br />
 Musterstraße 1<br />
 60311 Frankfurt am Main
 </p>
 </div>

 <div className="mb-8">
 <h2 className="text-[18px] font-medium text-near-black mb-3">{t('section7Title')}</h2>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('section7Text1')}<br />
 <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://ec.europa.eu/consumers/odr/</a><br />
 {t('section7Text2')}
 </p>
 </div>

 <div className="mb-8 last:mb-0">
 <h2 className="text-[18px] font-medium text-near-black mb-3">{t('section8Title')}</h2>
 <p className="text-[14px] text-gray-600 leading-relaxed">
 {t('section8Text')}
 </p>
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
