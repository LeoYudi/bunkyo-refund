import { EmailSettingsForm } from "@/components/forms/email-settings-form";
import { SettingsService } from "@/services/settings.service";

export default async function AdminSettingsPage() {
  const settingsService = new SettingsService();
  const settings = await settingsService.getEmailSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">
          Gerencie os modelos de e-mail e parâmetros padrão para solicitações de
          reembolso.
        </p>
      </div>

      <EmailSettingsForm initialSettings={settings} />
    </div>
  );
}
