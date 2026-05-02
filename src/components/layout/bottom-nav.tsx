"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

const mobileItems = navItems.filter((n) =>
  ["/dashboard", "/patients", "/appointments", "/invoices"].includes(n.href)
);

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: "var(--sidebar)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-opacity"
            )}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: isActive ? "#C5A660" : "rgba(255,255,255,0.40)" }}
            />
            <span
              className="font-thai text-[10px]"
              style={{
                color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.40)",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.labelTH}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
