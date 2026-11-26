import { AdminHeader } from "@/components/layout/admin-header";
import {
  AdminSidebar,
  type AdminSidebarUser,
} from "@/components/layout/admin-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sidebarUser: AdminSidebarUser | undefined;

  if (user) {
    const name =
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === "string" &&
        user.user_metadata.name) ||
      "Administrador";

    sidebarUser = {
      name,
      email: user.email,
    };
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar user={sidebarUser} />
      <div className="flex flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
