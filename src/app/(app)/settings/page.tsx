import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import type { ClinicSettings } from "@/types/supabase";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const supabase = await createClient();

  const { data } = await supabase
    .from("clinic_settings")
    .select("*")
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t("title")}</h1>
      <SettingsForm settings={data as ClinicSettings | null} />
    </div>
  );
}
