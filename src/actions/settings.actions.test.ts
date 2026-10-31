import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getEmailSettingsAction,
  saveEmailSettingsAction,
} from "@/actions/settings.actions";
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
} from "@/models/settings.model";
import { SettingsService } from "@/services/settings.service";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/settings.service", () => ({
  SettingsService: vi.fn(),
}));

describe("Settings Server Actions", () => {
  let mockServiceInstance: {
    getEmailSettings: ReturnType<typeof vi.fn>;
    saveEmailSettings: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      getEmailSettings: vi.fn(),
      saveEmailSettings: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(SettingsService).mockImplementation(function () {
      return mockServiceInstance as unknown as SettingsService;
    });
  });

  describe("getEmailSettingsAction", () => {
    it("should call settingsService.getEmailSettings() and return { success: true, data: settings }", async () => {
      const mockSettings: EmailSettings = {
        id: "settings-1",
        ...DEFAULT_EMAIL_SETTINGS,
        recipient_email: "financeiro@bunkyo.org.br",
        updated_at: "2026-10-31T12:00:00Z",
      };

      mockServiceInstance.getEmailSettings.mockResolvedValue(mockSettings);

      const result = await getEmailSettingsAction();

      expect(SettingsService).toHaveBeenCalledTimes(1);
      expect(mockServiceInstance.getEmailSettings).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        data: mockSettings,
      });
    });

    it("should catch errors and return { success: false, error: '...' }", async () => {
      mockServiceInstance.getEmailSettings.mockRejectedValue(
        new Error("Database connection error"),
      );

      const result = await getEmailSettingsAction();

      expect(result).toEqual({
        success: false,
        error: "Database connection error",
      });
    });
  });

  describe("saveEmailSettingsAction", () => {
    it("should call settingsService.saveEmailSettings(input), revalidate '/admin' and '/admin/settings', and return { success: true, data: savedSettings }", async () => {
      const input = {
        ...DEFAULT_EMAIL_SETTINGS,
        recipient_email: "financeiro@bunkyo.org.br",
      };

      const savedSettings: EmailSettings = {
        id: "settings-1",
        ...input,
        updated_at: "2026-10-31T12:00:00Z",
      };

      mockServiceInstance.saveEmailSettings.mockResolvedValue(savedSettings);

      const result = await saveEmailSettingsAction(input);

      expect(SettingsService).toHaveBeenCalledTimes(1);
      expect(mockServiceInstance.saveEmailSettings).toHaveBeenCalledWith(input);
      expect(revalidatePath).toHaveBeenCalledWith("/admin");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/settings");
      expect(result).toEqual({
        success: true,
        data: savedSettings,
      });
    });

    it("should catch errors and return { success: false, error: '...' }", async () => {
      const input = {
        ...DEFAULT_EMAIL_SETTINGS,
        approver_email: "invalid-email",
      };

      mockServiceInstance.saveEmailSettings.mockRejectedValue(
        new Error("Invalid email format"),
      );

      const result = await saveEmailSettingsAction(input);

      expect(result).toEqual({
        success: false,
        error: "Invalid email format",
      });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});
