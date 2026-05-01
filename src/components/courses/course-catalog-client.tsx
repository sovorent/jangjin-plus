"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CourseCatalog } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CourseDialog } from "./course-dialog";
import { MoreHorizontal } from "lucide-react";

interface Props {
  initialCourses: CourseCatalog[];
}

export function CourseCatalogClient({ initialCourses }: Props) {
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
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
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            {t("filter_active")}
          </Button>
          <Button
            variant={filter === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("archived")}
          >
            {t("filter_archived")}
          </Button>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingCourse(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("new_course")}
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead className="text-right">{t("columns.sessions")}</TableHead>
              <TableHead className="text-right">{t("columns.price")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t("no_courses")}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="font-medium">{course.name_en}</div>
                    <div className="text-sm text-muted-foreground">{course.name_th}</div>
                  </TableCell>
                  <TableCell className="text-right">{course.total_sessions}</TableCell>
                  <TableCell className="text-right">
                    ฿{course.price_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {!course.is_active && (
                      <Badge variant="secondary">{t("archived_badge")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(course)}>
                          {tCommon("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchiveToggle(course)}>
                          {course.is_active ? t("archive") : t("unarchive")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CourseDialog
        open={dialogOpen}
        course={editingCourse}
        onClose={handleDialogClose}
        onSaved={handleSaved}
      />
    </>
  );
}
