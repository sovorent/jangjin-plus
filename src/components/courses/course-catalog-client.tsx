"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CourseCatalog } from "@/types/supabase";
import { CourseDialog } from "./course-dialog";

interface Props {
  initialCourses: CourseCatalog[];
}

export function CourseCatalogClient({ initialCourses }: Props) {
  const t = useTranslations("courses");
  const [courses, setCourses] = useState(initialCourses);
  const [filter, setFilter] = useState<"active" | "archived">("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseCatalog | null>(null);

  const filtered = courses.filter((c) =>
    filter === "active" ? c.is_active : !c.is_active
  );

  async function handleArchiveToggle(course: CourseCatalog) {
    const newState = !course.is_active;
    const confirmed = window.confirm(
      newState ? t("form.unarchive_confirm") : t("form.archive_confirm")
    );
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("course_catalog")
      .update({ is_active: newState })
      .eq("id", course.id);

    if (error) {
      toast.error(t("form.save_error"));
      return;
    }

    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, is_active: newState } : c))
    );
    toast.success(t("form.save_success"));
  }

  function handleEdit(course: CourseCatalog) {
    setEditingCourse(course);
    setDialogOpen(true);
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setEditingCourse(null);
  }

  function handleSaved(saved: CourseCatalog) {
    setCourses((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    handleDialogClose();
    toast.success(t("form.save_success"));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-7 md:px-8 pt-6 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="font-serif text-[20px] font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              โปรแกรม
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Course Catalog
            </p>
          </div>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold font-thai transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#fff" }}
            onClick={() => { setEditingCourse(null); setDialogOpen(true); }}
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มโปรแกรมใหม่
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-4">
          {(["active", "archived"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-lg text-[12px] font-thai transition-colors"
              style={{
                background: filter === f ? "var(--primary)" : "transparent",
                color: filter === f ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${filter === f ? "var(--primary)" : "var(--border)"}`,
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f === "active" ? "ใช้งาน" : "เก็บถาวร"}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto px-7 md:px-8 py-5">
        {filtered.length === 0 ? (
          <div
            className="py-16 text-center text-[13px] font-thai"
            style={{ color: "var(--text-muted)" }}
          >
            ยังไม่มีโปรแกรม
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((course) => (
              <div
                key={course.id}
                className="rounded-xl p-5 relative overflow-hidden"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                  opacity: course.is_active ? 1 : 0.65,
                }}
              >
                {!course.is_active && (
                  <div
                    className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide"
                    style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
                  >
                    ARCHIVED
                  </div>
                )}

                {/* Top colour bar */}
                <div
                  className="h-[3px] rounded-sm mb-4"
                  style={{ background: course.is_active ? "var(--primary)" : "var(--border)" }}
                />

                <div className="mb-3">
                  <div
                    className="font-thai text-[15px] font-semibold mb-0.5"
                    style={{ color: "var(--foreground)" }}
                  >
                    {course.name_th || course.name_en}
                  </div>
                  <div className="text-[11px] tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {course.name_en}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    className="rounded-lg p-2.5 text-center"
                    style={{ background: "var(--background)" }}
                  >
                    <div
                      className="font-serif text-[20px] font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      {course.total_sessions}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      ครั้ง / Sessions
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-2.5 text-center"
                    style={{ background: "var(--background)" }}
                  >
                    <div
                      className="font-sans text-[16px] font-bold"
                      style={{ color: "var(--gold)" }}
                    >
                      ฿{course.price_thb.toLocaleString("en")}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      ราคา / Price
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold font-thai transition-opacity hover:opacity-80"
                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleArchiveToggle(course)}
                    className="flex-1 py-1.5 rounded-lg text-[12px] font-thai transition-opacity hover:opacity-80"
                    style={{
                      background: course.is_active ? "var(--warning-light)" : "var(--success-light)",
                      color: course.is_active ? "var(--warning)" : "var(--success)",
                    }}
                  >
                    {course.is_active ? "ซ่อน (Archive)" : "เปิดใช้งาน"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CourseDialog
        open={dialogOpen}
        course={editingCourse}
        onClose={handleDialogClose}
        onSaved={handleSaved}
      />
    </div>
  );
}
