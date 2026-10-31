import type {
  EmailSettings,
  EmailSettingsInput,
} from "@/models/settings.model";
import {
  DEFAULT_EMAIL_SETTINGS,
  EmailSettingsSchema,
} from "@/models/settings.model";
import { SettingsRepository } from "@/repositories/settings.repository";

export class SettingsService {
  constructor(
    private repository: SettingsRepository = new SettingsRepository(),
  ) {}

  async getEmailSettings(): Promise<EmailSettings> {
    const saved = await this.repository.getSettings();
    if (saved) {
      return saved;
    }
    return {
      id: "default",
      ...DEFAULT_EMAIL_SETTINGS,
    } as EmailSettings;
  }

  async saveEmailSettings(
    input: Partial<EmailSettingsInput>,
  ): Promise<EmailSettings> {
    const validated = EmailSettingsSchema.parse(input);
    return await this.repository.upsertSettings(validated);
  }
}
