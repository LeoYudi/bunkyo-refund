import { z } from "zod";

export interface EmailSettingsPayload {
  recipient_email: string;
  cc_email: string;
  bcc_email: string;
  subject_prefix: string;
  default_event_description: string;
  greeting_text: string;
  intro_text_template: string;
  spreadsheet_text: string;
  approver_email: string;
  approval_request_text: string;
  closing_text: string;
  sender_name: string;
  sender_role: string;
  sender_email: string;
  sender_phone: string;
}

export interface EmailSettings extends EmailSettingsPayload {
  id: string;
  updated_at?: string;
  updated_by?: string | null;
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettingsPayload = {
  recipient_email: "not-implemented",
  cc_email: "not-implemented",
  bcc_email: "not-implemented",
  subject_prefix: "",
  default_event_description: "not-implemented",
  greeting_text: "",
  intro_text_template: "",
  spreadsheet_text: "",
  approver_email: "",
  approval_request_text: "",
  closing_text: "",
  sender_name: "",
  sender_role: "",
  sender_email: "",
  sender_phone: "",
};

export const EmailSettingsSchema = z
  .unknown()
  .transform((): EmailSettingsPayload => {
    throw new Error("Not implemented");
  });
