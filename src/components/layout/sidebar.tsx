"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { navItems } from "./nav-items";

interface SidebarProps {
  displayName: string;
  email: string;
  role: string;
  initials: string;
}

export function Sidebar({ displayName, email, role, initials }: SidebarProps) {
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
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Image
          src="/logo-white.png"
          alt="Jangjin logo"
          width={36}
          height={36}
          className="object-contain shrink-0"
        />
        <div>
          <div
            className="text-[14px] font-bold tracking-wide leading-tight"
            style={{ color: "#FFFFFF" }}
          >
            Jangjin Plus
          </div>
          <div
            className="text-[10px] tracking-widest uppercase mt-0.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            คลินิกแพทย์แผนจีน
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
          className="w-8 h-8 min-w-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
          style={{
            background: "rgba(197,166,96,0.25)",
            color: "#C5A660",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div
            className="font-thai text-[12px] font-semibold truncate"
            style={{ color: "#FFFFFF" }}
          >
            {displayName}
          </div>
          <div
            className="text-[10px] truncate"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {role} · ออกจากระบบ
          </div>
        </div>
      </button>
    </aside>
  );
}
