import { LayoutDashboard, Users, BookOpen, FileText, Settings } from "lucide-react";

export const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/patients", labelKey: "nav.patients", icon: Users },
  { href: "/courses", labelKey: "nav.courses", icon: BookOpen },
  { href: "/invoices", labelKey: "nav.invoices", icon: FileText },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;
