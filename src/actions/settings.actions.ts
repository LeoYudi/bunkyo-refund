"use server";

import type {
  EmailSettings,
  EmailSettingsPayload,
} from "@/models/settings.model";

export type EmailSettingsActionResult =
  | { success: true; data: EmailSettings }
  | { success: false; error: string };

export async function getEmailSettingsAction(): Promise<EmailSettingsActionResult> {
  throw new Error("Not implemented");
}

export async function saveEmailSettingsAction(
  _input: Partial<EmailSettingsPayload>,
): Promise<EmailSettingsActionResult> {
  throw new Error("Not implemented");
}
