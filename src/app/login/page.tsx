"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/forms/admin-login-form";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

function SessionExpiredAlert() {
  const searchParams = useSearchParams();
  if (searchParams.get("reason") === "google_session_expired") {
    return (
      <div
        role="alert"
        className="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center"
      >
        Sessão do Google expirada. Faça login novamente.
      </div>
    );
  }
  if (searchParams.get("error") === "unauthorized_email") {
    return (
      <div
        role="alert"
        className="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center"
      >
        Acesso negado: apenas e-mails do domínio @bunkyo.org.br ou contas
        autorizadas podem acessar o painel.
      </div>
    );
  }
  return null;
}

export default function AdminLoginPage() {
  const router = useRouter();

  const handleLogin = async (data: { email: string; password: string }) => {
    const supabase = createClient();

    if (data.email === "google") {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "https://www.googleapis.com/auth/gmail.send",
        },
      });
      if (error) {
        toast.add({
          type: "error",
          title: "Erro no login com Google",
          description: error.message,
        });
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.add({
        type: "error",
        title: "Erro ao entrar",
        description: error.message,
      });
      return;
    }

    toast.add({
      type: "success",
      title: "Login realizado com sucesso",
      description: "Redirecionando...",
    });
    router.push("/admin");
  };

  return (
    <main className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-background p-8 rounded-xl shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Acesso Restrito</h1>
          <p className="text-sm text-muted-foreground">
            Entre com suas credenciais de administrador.
          </p>
        </div>

        <Suspense fallback={null}>
          <SessionExpiredAlert />
        </Suspense>

        <AdminLoginForm onSubmit={handleLogin} />
      </div>
    </main>
  );
}
