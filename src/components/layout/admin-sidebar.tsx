"use client";

import Link from "next/link";
import { useTransition } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <aside className="w-64 min-h-screen border-r bg-card p-6 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="text-xl font-bold">Painel Admin</div>
        <nav className="space-y-2">
          <Link
            href="/admin/requests"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Solicitações
          </Link>
        </nav>
      </div>
      <div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
          disabled={isPending}
        >
          Sair
        </Button>
      </div>
    </aside>
  );
}
