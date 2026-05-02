"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { navItems } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="hidden md:flex flex-col w-[220px] min-w-[220px] min-h-screen"
      style={{ background: "var(--sidebar)" }}
    >
      {/* Logo / Clinic name */}
      <div
        className="flex items-center gap-2.5 px-5 py-6"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="w-9 h-9 min-w-9 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ background: "rgba(255,255,255,0.10)" }}
        >
          <Image
            src="/logo.png"
            alt="Jangjin logo"
            width={32}
            height={32}
            className="object-contain"
            style={{ filter: "invert(1) brightness(2)" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span
            className="font-serif text-sm font-bold leading-none"
            style={{ color: "#C5A660" }}
          >
            張
          </span>
        </div>
        <div>
          <div
            className="font-serif text-[13px] font-bold leading-tight tracking-wide"
            style={{ color: "#FFFFFF" }}
          >
            張珍
          </div>
          <div
            className="text-[10px] tracking-widest uppercase mt-0.5"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            Jangjin Plus
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-5 py-2.5 mb-0.5 transition-colors border-l-2",
                isActive
                  ? "border-[#C5A660]"
                  : "border-transparent hover:border-transparent"
              )}
              style={{
                background: isActive
                  ? "rgba(255,255,255,0.10)"
                  : "transparent",
              }}
            >
              <Icon
                className="w-[18px] h-[18px] shrink-0"
                style={{
                  color: isActive ? "#FFFFFF" : "var(--sidebar-text)",
                }}
              />
              <div className="text-left">
                <div
                  className="font-thai text-[13px] leading-tight"
                  style={{
                    color: isActive ? "#FFFFFF" : "var(--sidebar-text)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {item.labelTH}
                </div>
                <div
                  className="text-[10px] tracking-wide leading-tight"
                  style={{
                    color: isActive
                      ? "rgba(255,255,255,0.45)"
                      : "rgba(255,255,255,0.30)",
                  }}
                >
                  {item.labelEN}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 px-5 py-4 w-full text-left transition-opacity hover:opacity-80"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="w-8 h-8 min-w-8 rounded-full flex items-center justify-center font-serif text-[13px] font-semibold"
          style={{
            background: "rgba(197,166,96,0.25)",
            color: "#C5A660",
          }}
        >
          จ
        </div>
        <div>
          <div
            className="font-thai text-[12px] font-semibold"
            style={{ color: "#FFFFFF" }}
          >
            แพทย์จางจิน
          </div>
          <div
            className="text-[10px]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            owner · ออกจากระบบ
          </div>
        </div>
      </button>
    </aside>
  );
}
