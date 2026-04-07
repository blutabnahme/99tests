"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PortalVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Redirect to the API route which sets the cookie and redirects to /portal
      window.location.href = `/api/portal/auth/verify?token=${token}`;
    } else {
      router.replace('/portal/login?error=missing_token');
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 text-[14px] mt-4">Verifying your login link...</p>
      </div>
    </div>
  );
}
