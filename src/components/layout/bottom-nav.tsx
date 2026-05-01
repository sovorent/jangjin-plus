"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

// Show only the 4 most-used items on mobile; Settings is accessible from sidebar
const mobileItems = navItems.slice(0, 4);

export function BottomNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t bg-white">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              isActive ? "text-[#0F4C81]" : "text-gray-500"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
