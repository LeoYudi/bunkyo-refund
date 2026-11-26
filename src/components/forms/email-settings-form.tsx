"use client";

import { useState } from "react";
import { saveEmailSettingsAction } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailPreviewCard } from "@/components/ui/email-preview-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
} from "@/models/settings.model";

interface EmailSettingsFormProps {
  initialSettings: EmailSettings;
}

export function EmailSettingsForm({ initialSettings }: EmailSettingsFormProps) {
  const [values, setValues] = useState<EmailSettings>({ ...initialSettings });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleChange = (field: keyof EmailSettings, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await saveEmailSettingsAction(values);
      if (res.success && res.data) {
        setValues(res.data);
        setFeedback({
          type: "success",
          message: "Configurações salvas com sucesso!",
        });
      } else {
        const errorMsg =
          "error" in res ? res.error : "Erro ao salvar configurações.";
        setFeedback({
          type: "error",
          message: errorMsg || "Erro ao salvar configurações.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Erro inesperado ao salvar configurações.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = () => {
    setValues({
      ...initialSettings,
      ...DEFAULT_EMAIL_SETTINGS,
      id: initialSettings.id,
      updated_at: initialSettings.updated_at,
    });
    setFeedback({
      type: "success",
      message: "Padrões CJB restaurados no formulário.",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de E-mail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback && (
              <div
                role={feedback.type === "success" ? "status" : "alert"}
                className={`p-3 rounded text-sm ${
                  feedback.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="recipient_email">Para / Destinatário</Label>
              <Input
                id="recipient_email"
                value={values.recipient_email ?? ""}
                onChange={(e) =>
                  handleChange("recipient_email", e.target.value)
                }
                placeholder="financeiro@bunkyo.org.br"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cc_email">Cc</Label>
                <Input
                  id="cc_email"
                  value={values.cc_email ?? ""}
                  onChange={(e) => handleChange("cc_email", e.target.value)}
                  placeholder="gestor@bunkyo.org.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bcc_email">Cco</Label>
                <Input
                  id="bcc_email"
                  value={values.bcc_email ?? ""}
                  onChange={(e) => handleChange("bcc_email", e.target.value)}
                  placeholder="diretoria@bunkyo.org.br"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject_prefix">Padrão de Assunto</Label>
              <Input
                id="subject_prefix"
                value={values.subject_prefix ?? ""}
                onChange={(e) => handleChange("subject_prefix", e.target.value)}
                placeholder="Reembolso CJB - "
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_event_description">
                Descrição Padrão do Evento
              </Label>
              <Input
                id="default_event_description"
                value={values.default_event_description ?? ""}
                onChange={(e) =>
                  handleChange("default_event_description", e.target.value)
                }
                placeholder="gastos com baiten do DFI 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="greeting_text">Saudação</Label>
              <Input
                id="greeting_text"
                value={values.greeting_text ?? ""}
                onChange={(e) => handleChange("greeting_text", e.target.value)}
                placeholder="Pessoal, bom dia."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intro_text_template">Texto Introdutório</Label>
              <textarea
                id="intro_text_template"
                className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={values.intro_text_template ?? ""}
                onChange={(e) =>
                  handleChange("intro_text_template", e.target.value)
                }
                placeholder="Gostaria de solicitar o reembolso referente aos {eventDescription}."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spreadsheet_text">Texto da Planilha</Label>
              <textarea
                id="spreadsheet_text"
                className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={values.spreadsheet_text ?? ""}
                onChange={(e) =>
                  handleChange("spreadsheet_text", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="approver_email">E-mail de Aprovação</Label>
                <Input
                  id="approver_email"
                  value={values.approver_email ?? ""}
                  onChange={(e) =>
                    handleChange("approver_email", e.target.value)
                  }
                  placeholder="jaque.hanaoka@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approval_request_text">
                  Texto de Aprovação
                </Label>
                <Input
                  id="approval_request_text"
                  value={values.approval_request_text ?? ""}
                  onChange={(e) =>
                    handleChange("approval_request_text", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closing_text">Despedida</Label>
              <Input
                id="closing_text"
                value={values.closing_text ?? ""}
                onChange={(e) => handleChange("closing_text", e.target.value)}
                placeholder="Atenciosamente,"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender_name">Nome</Label>
                <Input
                  id="sender_name"
                  value={values.sender_name ?? ""}
                  onChange={(e) => handleChange("sender_name", e.target.value)}
                  placeholder="Lucas Tamanaha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_role">Cargo</Label>
                <Input
                  id="sender_role"
                  value={values.sender_role ?? ""}
                  onChange={(e) => handleChange("sender_role", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender_email">E-mail na Assinatura</Label>
                <Input
                  id="sender_email"
                  value={values.sender_email ?? ""}
                  onChange={(e) => handleChange("sender_email", e.target.value)}
                  placeholder="jovens@bunkyo.org.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_phone">Telefone</Label>
                <Input
                  id="sender_phone"
                  value={values.sender_phone ?? ""}
                  onChange={(e) => handleChange("sender_phone", e.target.value)}
                  placeholder="(16) 99332-8607"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Configurações"}
              </Button>
              <Button type="button" variant="outline" onClick={handleRestore}>
                Restaurar Padrões CJB
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-6 space-y-4">
        <h3 className="font-semibold text-lg text-slate-800">
          Pré-visualização do E-mail
        </h3>
        <EmailPreviewCard settings={values} />
      </div>
    </form>
  );
}
