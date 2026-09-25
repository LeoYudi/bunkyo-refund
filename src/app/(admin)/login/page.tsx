"use client";

import { AdminLoginForm } from "@/components/forms/admin-login-form";
import { toast } from "@/components/ui/toast";

export default function AdminLoginPage() {
  const handleLogin = async (data: { email: string; password: string }) => {
    // Aqui vai entrar a Server Action de Login com Supabase no futuro
    console.log("Tentativa de login com:", data);
    toast.add({
      type: "info",
      title: "Autenticação em breve",
      description:
        "A integração com Supabase Auth será feita no próximo passo.",
    });
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

        <AdminLoginForm onSubmit={handleLogin} />
      </div>
    </main>
  );
}
