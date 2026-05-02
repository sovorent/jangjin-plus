import { createClient } from "@/lib/supabase/server";
import { CourseCatalogClient } from "@/components/courses/course-catalog-client";
import type { CourseCatalog } from "@/types/supabase";

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("course_catalog")
    .select("*")
    .order("created_at", { ascending: false });

  return <CourseCatalogClient initialCourses={(courses ?? []) as CourseCatalog[]} />;
}
