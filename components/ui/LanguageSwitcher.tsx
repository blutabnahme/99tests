"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { FlagIcon } from './FlagIcon';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  
  const [currentLocale, setCurrentLocale] = useState('en');

  useEffect(() => {
    const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
    if (match) setCurrentLocale(match[1]);
  }, []);

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    setCurrentLocale(newLocale);
    setOpen(false);
    router.refresh();
  };

  const currentLang = languages.find(l => l.code === currentLocale) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-[13px] font-medium text-gray-600 transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        {compact ? (
          <FlagIcon locale={currentLang.code} className="w-[18px] h-[13px] rounded-sm object-cover shrink-0" />
        ) : (
          <span className="flex items-center gap-2">
            <FlagIcon locale={currentLang.code} className="w-[18px] h-[13px] rounded-sm object-cover shrink-0" />
            <span>{currentLang.code.toUpperCase()}</span>
          </span>
        )}
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLocale(lang.code)}
                className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  currentLocale === lang.code ? 'text-[#008085] font-semibold' : 'text-gray-700'
                }`}
              >
                <FlagIcon locale={lang.code} className="w-[20px] h-[14px] rounded-sm object-cover shrink-0" />
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
