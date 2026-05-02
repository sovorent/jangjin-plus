"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("rate limit") || error.message.includes("429")) {
        setServerError(t("error_locked"));
      } else if (
        error.message.toLowerCase().includes("invalid") ||
        error.message.toLowerCase().includes("credentials")
      ) {
        setServerError(t("error_invalid"));
      } else {
        setServerError(t("error_generic"));
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[42%] bg-[#0B1D35] flex-col items-center justify-center relative px-10 py-12">
        <div className="flex flex-col items-center gap-5">
          <Image
            src="/logo-white.png"
            alt="JangJin Clinic"
            width={120}
            height={120}
            className="object-contain"
          />

          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-white text-lg font-semibold tracking-[0.25em]">JANGJIN PLUS</p>
            <div className="w-8 h-px bg-white/25" />
            <p className="text-white/80 text-sm font-medium">คลินิกแพทย์แผนจีนจางจิน</p>
            <p className="text-white/45 text-xs">Acupuncture & Chinese Medicine</p>
          </div>
        </div>

        <p className="absolute bottom-8 text-white/25 text-xs tracking-widest">
          JANGJIN PLUS v1.0 · 2569
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F5F1EC] px-8 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <h1 className="text-[2rem] font-bold text-gray-900 leading-tight mb-1">
              {t("title")}
            </h1>
            <p className="text-gray-500 text-sm">{t("subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">
                <span className="font-semibold text-gray-900">อีเมล</span>{" "}
                <span className="font-normal text-gray-400">Email</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="bg-white border-gray-200 h-11"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">
                <span className="font-semibold text-gray-900">รหัสผ่าน</span>{" "}
                <span className="font-normal text-gray-400">Password</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="bg-white border-gray-200 h-11 pr-16"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  {showPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="text-right -mt-1">
              <Link
                href="/reset-password"
                className="text-sm text-[#0F4C81] hover:underline"
              >
                ลืมรหัสผ่าน? / Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#0F4C81] hover:bg-[#0d3d6e] text-white text-base font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
