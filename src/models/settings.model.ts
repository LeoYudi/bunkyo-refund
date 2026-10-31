import { z } from "zod";
import type { Database } from "@/models/database.types";

export const DEFAULT_EMAIL_SETTINGS = {
  recipient_email: "",
  cc_email: "",
  bcc_email: "",
  subject_prefix: "Reembolso CJB - ",
  default_event_description: "",
  greeting_text: "Pessoal, bom dia.",
  intro_text_template:
    "Gostaria de solicitar o reembolso referente aos {eventDescription}.",
  spreadsheet_text:
    'A planilha compartilhada "Solicitação de Reembolso de Despesas" foi preenchida com os valores e informações das notas que competem ao evento.',
  approver_email: "jaque.hanaoka@gmail.com",
  approval_request_text:
    "Por gentileza, poderia revisar e aprovar esta solicitação?",
  closing_text: "Atenciosamente,",
  sender_name: "Lucas Tamanaha",
  sender_role:
    "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
  sender_email: "jovens@bunkyo.org.br",
  sender_phone: "(16) 99332-8607",
};

export const EmailSettingsSchema = z.object({
  recipient_email: z
    .string()
    .trim()
    .refine((val) => val === "" || z.string().email().safeParse(val).success, {
      message: "E-mail inválido",
    })
    .default(DEFAULT_EMAIL_SETTINGS.recipient_email),
  cc_email: z.string().default(DEFAULT_EMAIL_SETTINGS.cc_email),
  bcc_email: z.string().default(DEFAULT_EMAIL_SETTINGS.bcc_email),
  subject_prefix: z.string().default(DEFAULT_EMAIL_SETTINGS.subject_prefix),
  default_event_description: z
    .string()
    .default(DEFAULT_EMAIL_SETTINGS.default_event_description),
  greeting_text: z
    .string()
    .trim()
    .min(1, "A saudação é obrigatória")
    .default(DEFAULT_EMAIL_SETTINGS.greeting_text),
  intro_text_template: z
    .string()
    .trim()
    .min(1, "O texto introdutório é obrigatório")
    .default(DEFAULT_EMAIL_SETTINGS.intro_text_template),
  spreadsheet_text: z.string().default(DEFAULT_EMAIL_SETTINGS.spreadsheet_text),
  approver_email: z
    .string()
    .trim()
    .email("E-mail de aprovação inválido")
    .default(DEFAULT_EMAIL_SETTINGS.approver_email),
  approval_request_text: z
    .string()
    .default(DEFAULT_EMAIL_SETTINGS.approval_request_text),
  closing_text: z
    .string()
    .trim()
    .min(1, "A despedida é obrigatória")
    .default(DEFAULT_EMAIL_SETTINGS.closing_text),
  sender_name: z
    .string()
    .trim()
    .min(1, "O nome na assinatura é obrigatório")
    .default(DEFAULT_EMAIL_SETTINGS.sender_name),
  sender_role: z
    .string()
    .trim()
    .min(1, "O cargo na assinatura é obrigatório")
    .default(DEFAULT_EMAIL_SETTINGS.sender_role),
  sender_email: z
    .string()
    .trim()
    .email("E-mail na assinatura inválido")
    .default(DEFAULT_EMAIL_SETTINGS.sender_email),
  sender_phone: z.string().default(DEFAULT_EMAIL_SETTINGS.sender_phone),
});

export type EmailSettingsInput = z.infer<typeof EmailSettingsSchema>;

export type EmailSettings =
  Database["public"]["Tables"]["email_settings"]["Row"];
