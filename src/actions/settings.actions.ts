"use server";

import { revalidatePath } from "next/cache";
import type {
  EmailSettings,
  EmailSettingsInput,
} from "@/models/settings.model";
import { SettingsService } from "@/services/settings.service";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return String(error);
}

export async function getEmailSettingsAction(): Promise<
  { success: true; data: EmailSettings } | { success: false; error: string }
> {
  try {
    const service = new SettingsService();
    const data = await service.getEmailSettings();
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function saveEmailSettingsAction(
  input: Partial<EmailSettingsInput>,
): Promise<
  { success: true; data: EmailSettings } | { success: false; error: string }
> {
  try {
    const service = new SettingsService();
    const data = await service.saveEmailSettings(input);
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) };
  }
}
