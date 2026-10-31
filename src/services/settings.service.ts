import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/models/database.types";
import type {
  EmailSettings,
  EmailSettingsPayload,
} from "@/models/settings.model";
import type { SettingsRepository } from "@/repositories/settings.repository";

export class SettingsService {
  constructor(
    repositoryOrClient?: SettingsRepository | SupabaseClient<Database>,
  ) {
    void repositoryOrClient;
  }

  async getEmailSettings(): Promise<EmailSettings> {
    throw new Error("Not implemented");
  }

  async saveEmailSettings(
    _input: Partial<EmailSettingsPayload>,
  ): Promise<EmailSettings> {
    return {} as EmailSettings;
  }
}
