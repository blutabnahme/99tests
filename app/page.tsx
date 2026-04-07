"use client";

import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export default function Landing99Tests() {
 return (
 <div className="font-body text-near-black bg-gray-50 overflow-x-hidden flex flex-col min-h-screen">
 <Navbar />

 <main className="flex-1">
 {/* HERO */}
 <section id="hero" className="pt-[140px] pb-20 px-6 lg:px-12 max-w-[1280px] mx-auto text-center flex flex-col items-center">
 <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-7">
 <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
 <span className="text-[13px] font-semibold text-primary">Labordiagnostik Plattform</span>
 </div>
 
 <h1 className="font-heading text-h1 text-[42px] sm:text-[54px] lg:text-[64px] text-near-black mb-6 max-w-[800px] leading-[1.1]">
 Labordiagnostik,<br/>einfach gemacht
 </h1>
 
 <p className="text-[17px] sm:text-[20px] leading-relaxed text-gray-500 mb-10 max-w-[600px]">
 Empfehlen Sie Laboruntersuchungen und erhalten Sie Ergebnisse digital.
 </p>
 
 <div className="flex flex-col sm:flex-row gap-4">
 <Link href="/register/doctor" className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 text-[16px] bg-primary hover:bg-primary-dark text-white rounded-full font-semibold shadow-md transition-colors">
 Jetzt starten &rarr;
 </Link>
 </div>
 </section>

 {/* FEATURES */}
 <section id="features" className="py-20 bg-white">
 <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
 <div className="text-center mb-16">
 <span className="text-[12px] font-semibold text-primary uppercase tracking-widest">Die Vorteile</span>
 <h2 className="font-heading text-[32px] md:text-[38px] font-medium mt-3 tracking-tight">Klinische Diagnostik<br/>neu gedacht</h2>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-primary/20 transition-colors">
 <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm">
 <span className="text-2xl text-primary font-heading">01</span>
 </div>
 <h3 className="font-heading text-xl font-medium mb-3">Testkatalog</h3>
 <p className="text-gray-500 text-[15px] leading-relaxed">
 Über 500 Laborparameter aus führenden deutschen Laboren, gebündelt auf einer Plattform.
 </p>
 </div>

 <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-primary/20 transition-colors">
 <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm">
 <span className="text-2xl text-primary font-heading">02</span>
 </div>
 <h3 className="font-heading text-xl font-medium mb-3">Digitale Ergebnisse</h3>
 <p className="text-gray-500 text-[15px] leading-relaxed">
 Laborergebnisse sicher, schnell und strukturiert digital an Ihre Praxis zugestellt.
 </p>
 </div>

 <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-primary/20 transition-colors">
 <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm">
 <span className="text-2xl text-primary font-heading">03</span>
 </div>
 <h3 className="font-heading text-xl font-medium mb-3">Einfacher Prozess</h3>
 <p className="text-gray-500 text-[15px] leading-relaxed">
 Von der Empfehlung über die Entnahme bis zum Ergebnis — alles nahtlos auf einer Plattform.
 </p>
 </div>
 </div>
 </div>
 </section>
 </main>

 <Footer />
 </div>
 );
}
