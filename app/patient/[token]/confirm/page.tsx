"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ConfirmPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const t = useTranslations('patient.confirm');
  
  useEffect(() => {
    // Redirect to the main portal. The portal's data fetcher will see the
    // confirmed appointment and automatically skip to Step 4 (Payment/Summary).
    router.replace(`/patient/${params.token}`);
  }, [params.token, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-body text-near-black">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-light border-t-primary-dark rounded-full animate-spin mx-auto mb-4" />
        <p className="font-bold text-gray-500">{t('loading')}</p>
      </div>
    </div>
  );
}
