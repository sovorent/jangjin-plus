import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PatientForm } from "@/components/patients/patient-form";

export default async function NewPatientPage() {
  const t = await getTranslations("patients.form");

  return (
    <div className="max-w-2xl px-6 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/patients" className="text-sm text-muted-foreground hover:text-gray-900 flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Patients
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t("title_create")}</h1>
      <PatientForm />
    </div>
  );
}
