import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CourseCatalogClient } from "@/components/courses/course-catalog-client";
import type { CourseCatalog } from "@/types/supabase";

export default async function CoursesPage() {
  const t = await getTranslations("courses");
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("course_catalog")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t("title")}</h1>
      <CourseCatalogClient initialCourses={(courses ?? []) as CourseCatalog[]} />
    </div>
  );
}
