import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
} from "@/models/settings.model";
import { SettingsRepository } from "@/repositories/settings.repository";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = (mock: unknown) => {
  (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mock);
};

describe("SettingsRepository", () => {
  let repository: SettingsRepository;

  const mockSettingsRow: EmailSettings = {
    id: "settings-1",
    ...DEFAULT_EMAIL_SETTINGS,
    recipient_email: "financeiro@bunkyo.org.br",
    updated_at: "2026-10-31T12:00:00Z",
    updated_by: "admin-1",
  };

  beforeEach(() => {
    repository = new SettingsRepository();
    vi.clearAllMocks();
  });

  describe("getSettings", () => {
    it("should query email_settings with select('*').limit(1).maybeSingle() and return the record when it exists", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockSettingsRow,
          error: null,
        }),
      };

      mockCreateClient(mockSupabase);

      const result = await repository.getSettings();

      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("email_settings");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.limit).toHaveBeenCalledWith(1);
      expect(mockSupabase.maybeSingle).toHaveBeenCalled();
      expect(result).toEqual(mockSettingsRow);
    });

    it("should return null when no settings record exists in the database", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockCreateClient(mockSupabase);

      const result = await repository.getSettings();

      expect(result).toBeNull();
    });

    it("should throw an error when Supabase returns an error on getSettings", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to fetch email settings"),
        }),
      };

      mockCreateClient(mockSupabase);

      await expect(repository.getSettings()).rejects.toThrow(
        "Failed to fetch email settings",
      );
    });
  });

  describe("upsertSettings", () => {
    it("should update the existing record when getSettings() returns an existing row", async () => {
      const payload = {
        ...DEFAULT_EMAIL_SETTINGS,
        recipient_email: "novo-financeiro@bunkyo.org.br",
      };

      const updatedRow: EmailSettings = {
        ...mockSettingsRow,
        ...payload,
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockSettingsRow,
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedRow,
          error: null,
        }),
      };

      mockCreateClient(mockSupabase);

      const result = await repository.upsertSettings(payload);

      expect(mockSupabase.from).toHaveBeenCalledWith("email_settings");
      expect(mockSupabase.update).toHaveBeenCalledWith(payload);
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "settings-1");
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();
      expect(result).toEqual(updatedRow);
    });

    it("should insert a new record when getSettings() returns null", async () => {
      const payload = {
        ...DEFAULT_EMAIL_SETTINGS,
        recipient_email: "financeiro@bunkyo.org.br",
      };

      const createdRow: EmailSettings = {
        id: "settings-new",
        ...payload,
        updated_at: "2026-10-31T12:00:00Z",
        updated_by: null,
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createdRow,
          error: null,
        }),
      };

      mockCreateClient(mockSupabase);

      const result = await repository.upsertSettings(payload);

      expect(mockSupabase.from).toHaveBeenCalledWith("email_settings");
      expect(mockSupabase.insert).toHaveBeenCalledWith(payload);
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();
      expect(result).toEqual(createdRow);
    });

    it("should throw an error when the write operation returns an error", async () => {
      const payload = {
        ...DEFAULT_EMAIL_SETTINGS,
        recipient_email: "financeiro@bunkyo.org.br",
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to save email settings"),
        }),
      };

      mockCreateClient(mockSupabase);

      await expect(repository.upsertSettings(payload)).rejects.toThrow(
        "Failed to save email settings",
      );
    });
  });
});
