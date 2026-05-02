"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const t = useTranslations("nav");
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="md:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-3.5"
      style={{ background: "var(--sidebar)" }}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col">
          <span
            className="font-serif text-[14px] font-bold leading-tight"
            style={{ color: "#FFFFFF" }}
          >
            張珍
          </span>
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            Jangjin Plus
          </span>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "rgba(255,255,255,0.80)" }}
      >
        <LogOut className="w-4 h-4" />
        <span className="text-xs">{t("logout")}</span>
      </button>
    </header>
  );
}
