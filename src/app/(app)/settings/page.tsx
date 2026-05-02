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
    <div className="px-7 md:px-8 py-6">
      <div className="mb-6">
        <h1
          className="font-serif text-[20px] font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          ตั้งค่า
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {t("title")} · Settings
        </p>
      </div>
      <div className="max-w-2xl">
        <SettingsForm settings={data as ClinicSettings | null} />
      </div>
    </div>
  );
}
