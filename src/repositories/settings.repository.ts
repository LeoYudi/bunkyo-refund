import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/models/database.types";
import type {
  EmailSettings,
  EmailSettingsPayload,
} from "@/models/settings.model";

export class SettingsRepository {
  constructor(private supabaseClient?: SupabaseClient<Database>) {
    void this.supabaseClient;
  }

  async getSettings(): Promise<EmailSettings | null> {
    throw new Error("Not implemented");
  }

  async upsertSettings(
    _payload: Partial<EmailSettingsPayload>,
  ): Promise<EmailSettings> {
    throw new Error("Not implemented");
  }
}
