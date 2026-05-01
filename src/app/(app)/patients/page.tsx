import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PatientListClient } from "@/components/patients/patient-list-client";
import type { Patient } from "@/types/supabase";

export default async function PatientsPage() {
  const t = await getTranslations("patients");
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t("title")}</h1>
      <PatientListClient initialPatients={(patients ?? []) as Patient[]} />
    </div>
  );
}
