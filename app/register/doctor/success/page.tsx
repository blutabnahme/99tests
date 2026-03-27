import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function HCSuccessPage() {
  const t = await getTranslations('auth.success');
  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c0 0-7.5 7.5-7.5 12a7.5 7.5 0 1 0 15 0C19.5 9.5 12 2 12 2z"/></svg>
          </div>
          <span className="font-heading font-medium text-2xl tracking-tight text-near-black">
            99Tests<span className="text-primary">.de</span>
          </span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-sm border-gray-200 bg-white rounded-[20px] text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          
          <h2 className="font-heading text-2xl font-medium text-near-black mb-4">
            {t('title')}
          </h2>
          
          <p className="text-[15px] text-gray-500 mb-8 leading-relaxed">
            {t('hcDesc')} <strong className="text-near-black">{t('timeBlock')}</strong>.
          </p>
          
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl mb-8">
            <p className="text-[13px] text-orange-800 font-medium">
              {t('hcStatus')} <span className="font-bold">{t('pending')}</span>{t('hcStatusP2')}
            </p>
          </div>

          <Link href="/">
            <Button className="w-full sm:w-auto bg-slate-100 text-gray-600 hover:bg-slate-200 border border-slate-200 font-semibold">
              {t('returnHome')}
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
