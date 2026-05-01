"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type Filter = "all" | "active" | "none";

interface Props {
  initialPatients: Patient[];
}

export function PatientListClient({ initialPatients }: Props) {
  const t = useTranslations("patients");
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);

  const fetchPatients = useCallback(
    async (q: string) => {
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
    },
    []
  );

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
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("search_placeholder")}
            value={query}
            onChange={handleQueryChange}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "none"] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange(f)}
            >
              {f === "all"
                ? t("filter_all")
                : f === "active"
                ? t("filter_active_course")
                : t("filter_no_course")}
            </Button>
          ))}
        </div>
        <Button size="sm" asChild>
          <Link href="/patients/new">
            <Plus className="h-4 w-4 mr-1" />
            {t("new_patient")}
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.phone")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("columns.last_visit")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {t("no_patients")}
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/patients/${patient.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{patient.full_name ?? "—"}</div>
                    {patient.nickname && (
                      <div className="text-sm text-muted-foreground">{patient.nickname}</div>
                    )}
                  </TableCell>
                  <TableCell>{patient.phone ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    —
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/patients/${patient.id}/checkin`);
                      }}
                    >
                      {t("check_in")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
