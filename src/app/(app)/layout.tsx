import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User";

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar
        displayName={displayName}
        email={user.email ?? ""}
        role={profile?.role ?? "staff"}
        initials={initials}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      <BottomNav />
      <Toaster richColors position="top-right" />
    </div>
  );
}
