import { CalendarDays } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <div className="flex flex-col h-full">
      <div
        className="px-7 md:px-8 pt-6 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1
          className="font-serif text-[20px] font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          นัดหมาย
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          Appointments · Phase 2
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--primary-light)" }}
        >
          <CalendarDays
            className="w-8 h-8"
            style={{ color: "var(--primary)" }}
          />
        </div>
        <div className="text-center">
          <div
            className="font-serif text-[18px] font-semibold mb-1"
            style={{ color: "var(--foreground)" }}
          >
            ระบบนัดหมาย
          </div>
          <div
            className="font-thai text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            Appointment Calendar · Coming in Phase 2
          </div>
        </div>
      </div>
    </div>
  );
}
