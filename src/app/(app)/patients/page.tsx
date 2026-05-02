import { createClient } from "@/lib/supabase/server";
import { PatientListClient } from "@/components/patients/patient-list-client";
import type { Patient } from "@/types/supabase";

export default async function PatientsPage() {
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  return <PatientListClient initialPatients={(patients ?? []) as Patient[]} />;
}
