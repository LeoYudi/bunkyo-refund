"use client";

import {
  CircleUser,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Solicitações", href: "/admin/requests", icon: FileText },
  ];

  const secondaryNavItems = [
    { name: "Configurações", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 min-h-screen border-r bg-card flex flex-col justify-between">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <span className="font-bold text-lg">B</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">
                Bunkyo Refund
              </span>
              <span className="text-xs text-muted-foreground">
                Administração
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <hr className="my-6 border-t bg-border" />

          <nav className="space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <CircleUser className="h-8 w-8 text-muted-foreground shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">
                  Administrador
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  admin@bunkyo.org.br
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              disabled={isPending}
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
