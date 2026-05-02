import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BookOpen,
  FileText,
  Settings,
} from "lucide-react";

export const navItems = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    labelTH: "หน้าหลัก",
    labelEN: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/patients",
    labelKey: "nav.patients",
    labelTH: "คนไข้",
    labelEN: "Patients",
    icon: Users,
  },
  {
    href: "/appointments",
    labelKey: "nav.appointments",
    labelTH: "นัดหมาย",
    labelEN: "Appointments",
    icon: CalendarDays,
  },
  {
    href: "/courses",
    labelKey: "nav.courses",
    labelTH: "โปรแกรม",
    labelEN: "Courses",
    icon: BookOpen,
  },
  {
    href: "/invoices",
    labelKey: "nav.invoices",
    labelTH: "ใบเสร็จ",
    labelEN: "Invoices",
    icon: FileText,
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    labelTH: "ตั้งค่า",
    labelEN: "Settings",
    icon: Settings,
  },
] as const;
