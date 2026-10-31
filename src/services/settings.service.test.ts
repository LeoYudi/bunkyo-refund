import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
} from "@/models/settings.model";
import { SettingsRepository } from "@/repositories/settings.repository";
import { SettingsService } from "@/services/settings.service";

vi.mock("@/repositories/settings.repository", () => ({
  SettingsRepository: vi.fn(),
}));

describe("SettingsService", () => {
  let mockRepositoryInstance: {
    getSettings: ReturnType<typeof vi.fn>;
    upsertSettings: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepositoryInstance = {
      getSettings: vi.fn(),
      upsertSettings: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(SettingsRepository).mockImplementation(function () {
      return mockRepositoryInstance as unknown as SettingsRepository;
    });
  });

  describe("getEmailSettings", () => {
    it("should return the database record when repository.getSettings() returns an existing row", async () => {
      const storedSettings: EmailSettings = {
        id: "settings-db-1",
        ...DEFAULT_EMAIL_SETTINGS,
        recipient_email: "financeiro@bunkyo.org.br",
        updated_at: "2026-10-31T12:00:00Z",
        updated_by: "admin-1",
      };

      mockRepositoryInstance.getSettings.mockResolvedValue(storedSettings);

      const service = new SettingsService();
      const result = await service.getEmailSettings();

      expect(mockRepositoryInstance.getSettings).toHaveBeenCalledTimes(1);
      expect(result).toEqual(storedSettings);
    });

    it("should return an object based on DEFAULT_EMAIL_SETTINGS with id 'default' when repository.getSettings() returns null", async () => {
      mockRepositoryInstance.getSettings.mockResolvedValue(null);

      const service = new SettingsService();
      const result = await service.getEmailSettings();

      expect(mockRepositoryInstance.getSettings).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: "default",
        ...DEFAULT_EMAIL_SETTINGS,
      });
    });
  });

  describe("saveEmailSettings", () => {
    it("should validate input with EmailSettingsSchema, call repository.upsertSettings with validated data, and return the saved result", async () => {
      const input = {
        ...DEFAULT_EMAIL_SETTINGS,
        recipient_email: "financeiro@bunkyo.org.br",
        cc_email: "cc@bunkyo.org.br",
        default_event_description: "gastos do Haru Matsuri",
      };

      const savedRecord: EmailSettings = {
        id: "settings-db-1",
        ...input,
        updated_at: "2026-10-31T12:00:00Z",
        updated_by: "admin-1",
      };

      mockRepositoryInstance.upsertSettings.mockResolvedValue(savedRecord);

      const service = new SettingsService();
      const result = await service.saveEmailSettings(input);

      expect(mockRepositoryInstance.upsertSettings).toHaveBeenCalledWith(input);
      expect(result).toEqual(savedRecord);
    });

    it("should throw a validation error and not call repository.upsertSettings when input is invalid", async () => {
      const invalidInput = {
        ...DEFAULT_EMAIL_SETTINGS,
        approver_email: "invalido",
      };

      const service = new SettingsService();

      await expect(service.saveEmailSettings(invalidInput)).rejects.toThrow();
      expect(mockRepositoryInstance.upsertSettings).not.toHaveBeenCalled();
    });
  });
});
