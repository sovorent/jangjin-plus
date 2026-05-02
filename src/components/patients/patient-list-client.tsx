"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/types/supabase";
import { Skeleton } from "@/components/ui/skeleton";

type Filter = "all" | "active" | "none";

interface Props {
  initialPatients: Patient[];
}

function InitialAvatar({ name }: { name: string | null }) {
  const char = (name ?? "?")[0];
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-[13px] font-semibold shrink-0"
      style={{ background: "var(--primary-light)", color: "var(--primary)" }}
    >
      {char}
    </div>
  );
}

export function PatientListClient({ initialPatients }: Props) {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);

  const fetchPatients = useCallback(async (q: string) => {
    setLoading(true);
    const supabase = createClient();

    let queryBuilder = supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (q) {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${q}%,nickname.ilike.%${q}%,phone.ilike.%${q}%`
      );
    }

    const { data } = await queryBuilder;
    setPatients((data ?? []) as Patient[]);
    setLoading(false);
  }, []);

  const debouncedFetch = useDebounce(fetchPatients, 300);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    debouncedFetch(val);
  }

  function handleFilterChange(f: Filter) {
    setFilter(f);
    fetchPatients(query);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div
        className="px-7 md:px-8 pt-6 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="font-serif text-[20px] font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              คนไข้
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Patient Records
            </p>
          </div>
          <Link
            href="/patients/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold font-thai transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มคนไข้ใหม่
          </Link>
        </div>

        {/* Search + filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px]"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] font-thai transition-colors focus:outline-none focus:ring-1"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              placeholder="ค้นหาชื่อ, ชื่อเล่น, เบอร์โทร..."
              value={query}
              onChange={handleQueryChange}
            />
          </div>
          <div
            className="flex gap-1 p-0.5 rounded-lg"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
          >
            {(["all", "active", "none"] as Filter[]).map((f) => {
              const labels: Record<Filter, string> = {
                all: "ทั้งหมด",
                active: "มีคอร์ส",
                none: "ไม่มีคอร์ส",
              };
              return (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className="px-3 py-1.5 rounded-md text-[12px] font-thai transition-colors"
                  style={{
                    background: filter === f ? "var(--primary)" : "transparent",
                    color: filter === f ? "#fff" : "var(--text-secondary)",
                    fontWeight: filter === f ? 600 : 400,
                  }}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-7 md:px-8 pb-6">
        <table className="w-full border-collapse mt-1">
          <thead>
            <tr>
              {[
                "ชื่อ-นามสกุล",
                "เบอร์โทร",
                "คอร์สใช้งาน",
                "เข้ารับการรักษาล่าสุด",
                "ดำเนินการ",
              ].map((h) => (
                <th
                  key={h}
                  className="py-3 text-left text-[11px] font-medium uppercase tracking-wide"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5"><Skeleton className="h-3.5 w-28" /></td>
                  <td className="py-3.5"><Skeleton className="h-3.5 w-16" /></td>
                  <td className="py-3.5"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="py-3.5"><Skeleton className="h-7 w-28" /></td>
                </tr>
              ))
            ) : patients.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-[13px] font-thai"
                  style={{ color: "var(--text-muted)" }}
                >
                  ยังไม่มีคนไข้
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  {/* Name */}
                  <td className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <InitialAvatar name={patient.full_name} />
                      <div>
                        <button
                          className="font-thai text-[13px] font-semibold text-left transition-colors hover:underline"
                          style={{ color: "var(--foreground)" }}
                          onClick={() => router.push(`/patients/${patient.id}`)}
                        >
                          {patient.full_name ?? "—"}
                        </button>
                        {patient.nickname && (
                          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            ชื่อเล่น: {patient.nickname}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td
                    className="py-3.5 text-[13px] font-sans"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {patient.phone ?? "—"}
                  </td>

                  {/* Active courses — no DB field yet, show placeholder */}
                  <td className="py-3.5">
                    <span
                      className="text-[12px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      —
                    </span>
                  </td>

                  {/* Last visit */}
                  <td
                    className="py-3.5 text-[12px] font-thai"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    —
                  </td>

                  {/* Actions */}
                  <td className="py-3.5">
                    <div className="flex gap-1.5">
                      <button
                        className="px-3 py-1.5 rounded-md text-[11px] font-semibold font-thai transition-opacity hover:opacity-90"
                        style={{ background: "var(--teal)", color: "#fff" }}
                        onClick={() =>
                          router.push(`/patients/${patient.id}/checkin`)
                        }
                      >
                        Check-in
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-md text-[11px] font-thai transition-colors"
                        style={{
                          background: "var(--background)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                        }}
                        onClick={() => router.push(`/patients/${patient.id}`)}
                      >
                        โปรไฟล์
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
