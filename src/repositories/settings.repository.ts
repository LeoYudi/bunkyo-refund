import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/models/database.types";
import type {
  EmailSettings,
  EmailSettingsInput,
} from "@/models/settings.model";

export type { EmailSettings };

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

export class SettingsRepository {
  constructor(private supabaseClient?: SupabaseClient<Database>) {}

  private async getClient() {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }
    return await createClient();
  }

  async getSettings(): Promise<EmailSettings | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("email_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(extractErrorMessage(error));
    }

    return (data as EmailSettings) ?? null;
  }

  async upsertSettings(payload: EmailSettingsInput): Promise<EmailSettings> {
    const supabase = await this.getClient();
    const existing = await this.getSettings();

    if (existing) {
      const { data, error } = await supabase
        .from("email_settings")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(extractErrorMessage(error));
      }

      return data as EmailSettings;
    } else {
      const { data, error } = await supabase
        .from("email_settings")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw new Error(extractErrorMessage(error));
      }

      return data as EmailSettings;
    }
  }
}
