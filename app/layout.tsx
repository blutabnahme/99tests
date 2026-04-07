import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata: Metadata = {
 title: '99Tests — Präzise Diagnostik, einfach gemacht.',
 description: 'Professional blood collection marketplace connecting healthcare companies with qualified phlebotomists.',
 icons: {
 icon: { url: '/logo-icon.svg', type: 'image/svg+xml' },
 apple: '/logo-icon.svg',
 },
 manifest: '/site.webmanifest',
};

export default async function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 const locale = await getLocale();
 const messages = await getMessages();

 return (
 <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable}`}>
 <body className={`${GeistSans.className} font-body bg-gray-50 text-near-black antialiased`}>
 <NextIntlClientProvider messages={messages}>
 <ToastProvider>
 {children}
 <CookieConsent />
 </ToastProvider>
 </NextIntlClientProvider>
 </body>
 </html>
 );
}
