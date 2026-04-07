import React from 'react';

type FlagIconProps = {
 locale: string;
 className?: string;
};

export function FlagIcon({ locale, className = "w-6 h-4 block rounded-sm object-cover shrink-0" }: FlagIconProps) {
 switch (locale.toLowerCase()) {
 case 'en':
 return (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className={className}>
 <rect width="60" height="40" fill="#012169"/>
 <path d="M0 0l60 40m0-40L0 40" stroke="#fff" strokeWidth="6"/>
 <path d="M0 0l60 40m0-40L0 40" stroke="#C8102E" strokeWidth="4"/>
 <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="10"/>
 <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="6"/>
 </svg>
 );
 case 'de':
 return (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className={className}>
 <rect width="60" height="13.34" fill="#000"/>
 <rect y="13.34" width="60" height="13.33" fill="#DD0000"/>
 <rect y="26.67" width="60" height="13.33" fill="#FFCE00"/>
 </svg>
 );
 case 'es':
 return (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className={className}>
 <rect width="60" height="10" fill="#AA151B"/>
 <rect y="10" width="60" height="20" fill="#F1BF00"/>
 <rect y="30" width="60" height="10" fill="#AA151B"/>
 </svg>
 );
 case 'nl':
 return (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className={className}>
 <rect width="60" height="13.34" fill="#AE1C28"/>
 <rect y="13.34" width="60" height="13.33" fill="#FFFFFF"/>
 <rect y="26.67" width="60" height="13.33" fill="#21468B"/>
 </svg>
 );
 case 'fr':
 return (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className={className}>
 <rect width="20" height="40" fill="#002395"/>
 <rect x="20" width="20" height="40" fill="#FFFFFF"/>
 <rect x="40" width="20" height="40" fill="#ED2939"/>
 </svg>
 );
 default:
 return (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className={className}>
 <rect width="60" height="40" fill="#E5E7EB"/>
 <circle cx="30" cy="20" r="10" fill="#9CA3AF"/>
 </svg>
 );
 }
}
