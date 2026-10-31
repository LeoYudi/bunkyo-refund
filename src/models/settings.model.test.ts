import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMAIL_SETTINGS,
  EmailSettingsSchema,
} from "@/models/settings.model";

describe("Settings Model", () => {
  describe("DEFAULT_EMAIL_SETTINGS", () => {
    it("should contain the official CJB default values", () => {
      expect(DEFAULT_EMAIL_SETTINGS).toEqual({
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
      });
    });
  });

  describe("EmailSettingsSchema", () => {
    it("should validate a complete valid object with empty optional emails", () => {
      const validPayload = {
        recipient_email: "",
        cc_email: "",
        bcc_email: "",
        subject_prefix: "Reembolso CJB - ",
        default_event_description: "gastos do Imin Matsuri",
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

      const result = EmailSettingsSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPayload);
      }
    });

    it("should validate a complete valid object with populated recipient, cc, and bcc emails", () => {
      const validPayload = {
        recipient_email: "financeiro@bunkyo.org.br",
        cc_email: "cc@bunkyo.org.br",
        bcc_email: "bcc@bunkyo.org.br",
        subject_prefix: "Reembolso CJB - ",
        default_event_description: "gastos do evento",
        greeting_text: "Pessoal, bom dia.",
        intro_text_template:
          "Gostaria de solicitar o reembolso referente aos {eventDescription}.",
        spreadsheet_text: "Planilha preenchida.",
        approver_email: "jaque.hanaoka@gmail.com",
        approval_request_text: "Por gentileza, poderia revisar?",
        closing_text: "Atenciosamente,",
        sender_name: "Lucas Tamanaha",
        sender_role: "Diretor Financeiro",
        sender_email: "jovens@bunkyo.org.br",
        sender_phone: "(16) 99332-8607",
      };

      const result = EmailSettingsSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPayload);
      }
    });

    it("should populate DEFAULT_EMAIL_SETTINGS when optional fields with defaults are omitted", () => {
      const result = EmailSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(DEFAULT_EMAIL_SETTINGS);
      }
    });

    it.each([
      ["recipient_email", { recipient_email: "email-invalido" }],
      ["approver_email", { approver_email: "email-invalido" }],
      ["sender_email", { sender_email: "email-invalido" }],
    ])("should reject invalid email format for %s", (_field, override) => {
      const result = EmailSettingsSchema.safeParse({
        ...DEFAULT_EMAIL_SETTINGS,
        ...override,
      });

      expect(result.success).toBe(false);
    });

    it.each([
      ["greeting_text", { greeting_text: "" }],
      ["greeting_text (whitespace)", { greeting_text: "   " }],
      ["intro_text_template", { intro_text_template: "" }],
      ["intro_text_template (whitespace)", { intro_text_template: "   " }],
      ["closing_text", { closing_text: "" }],
      ["closing_text (whitespace)", { closing_text: "   " }],
      ["sender_name", { sender_name: "" }],
      ["sender_name (whitespace)", { sender_name: "   " }],
      ["sender_role", { sender_role: "" }],
      ["sender_role (whitespace)", { sender_role: "   " }],
    ])(
      "should reject empty or whitespace-only string for %s",
      (_field, override) => {
        const result = EmailSettingsSchema.safeParse({
          ...DEFAULT_EMAIL_SETTINGS,
          ...override,
        });

        expect(result.success).toBe(false);
      },
    );
  });
});
