"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { createClient } from "@/lib/supabase";
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  
  const [method, setMethod] = useState<"password" | "magic_link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (method === "password") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Redirect based on role
        const role = data.user.user_metadata?.role;
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'blood_collector') {
          router.push('/bc');
        } else if (role === 'doctor' || role === 'doctor_practice') {
          router.push('/dashboard');
        } else {
          router.push('/dashboard'); // fallback
        }
        router.refresh();
      }
    } else {
      // Magic Link Login
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(t('auth.magicLinkSent'));
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="99Tests" className="h-6 w-auto" />
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-sm border-gray-200 bg-white rounded-[20px]">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-medium text-near-black">{t('auth.login')}</h2>
            <p className="mt-2 text-[14px] text-gray-500">{t('auth.loginSub')}</p>
          </div>

          {/* Toggle Login Method */}
          <div className="flex p-1 bg-gray-200 rounded-full mb-8">
            <button
              onClick={() => setMethod("password")}
              className={`flex-1 text-[13px] font-semibold py-2 rounded-full transition-all ${
                method === "password" ? "bg-white text-near-black shadow-sm" : "text-gray-500 hover:text-near-black hover:bg-white/50"
              }`}
            >
              {t('auth.passwordMethod')}
            </button>
            <button
              onClick={() => setMethod("magic_link")}
              className={`flex-1 text-[13px] font-semibold py-2 rounded-full transition-all ${
                method === "magic_link" ? "bg-white text-near-black shadow-sm" : "text-gray-500 hover:text-near-black hover:bg-white/50"
              }`}
            >
              {t('auth.magicLinkMethod')}
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
              />
            </div>

            {method === "password" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <a href="#" className="text-[13px] font-semibold text-primary-dark hover:text-primary">
                    {t('auth.forgotPassword')}
                  </a>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-[13px] rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 text-green-700 text-[13px] rounded-lg border border-green-200">
                {success}
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full mt-4"
              disabled={loading}
            >
              {loading 
                ? t('auth.signingIn') 
                : method === "password" 
                  ? t('auth.login') 
                  : t('auth.sendMagicLink')}
            </Button>
          </form>

          <p className="mt-8 text-center text-[14px] text-gray-500">
            {t('auth.noAccount')}{" "}
            <Link href="/register" className="font-semibold text-primary-dark hover:text-primary">
              {t('auth.register')}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
