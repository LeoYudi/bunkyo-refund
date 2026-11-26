import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
} from "@/models/settings.model";
import { SettingsService } from "@/services/settings.service";
import AdminSettingsPage from "./page";

vi.mock("@/services/settings.service", () => ({
  SettingsService: vi.fn(),
}));

const mockEmailSettingsForm = vi.fn(
  ({ initialSettings }: { initialSettings: EmailSettings }) => (
    <div data-testid="mock-email-settings-form">
      {initialSettings.recipient_email}
    </div>
  ),
);

vi.mock("@/components/forms/email-settings-form", () => ({
  EmailSettingsForm: (props: { initialSettings: EmailSettings }) =>
    mockEmailSettingsForm(props),
}));

describe("AdminSettingsPage", () => {
  let mockServiceInstance: {
    getEmailSettings: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      getEmailSettings: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(SettingsService).mockImplementation(function () {
      return mockServiceInstance as unknown as SettingsService;
    });
  });

  it("should load email settings via SettingsService.getEmailSettings() and render EmailSettingsForm with initialSettings", async () => {
    const storedSettings: EmailSettings = {
      id: "settings-db-1",
      ...DEFAULT_EMAIL_SETTINGS,
      recipient_email: "financeiro@bunkyo.org.br",
      default_event_description: "gastos do DFI 2026",
      updated_at: "2026-11-26T10:00:00Z",
    };

    mockServiceInstance.getEmailSettings.mockResolvedValueOnce(storedSettings);

    const PageElement = await AdminSettingsPage();
    render(PageElement);

    expect(SettingsService).toHaveBeenCalledTimes(1);
    expect(mockServiceInstance.getEmailSettings).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mock-email-settings-form")).toBeInTheDocument();
    expect(mockEmailSettingsForm).toHaveBeenCalledWith(
      expect.objectContaining({
        initialSettings: storedSettings,
      }),
    );
  });

  it("should pass fallback default settings to EmailSettingsForm when SettingsService returns defaults", async () => {
    const defaultFallback = {
      id: "default",
      ...DEFAULT_EMAIL_SETTINGS,
    } as EmailSettings;

    mockServiceInstance.getEmailSettings.mockResolvedValueOnce(defaultFallback);

    const PageElement = await AdminSettingsPage();
    render(PageElement);

    expect(mockServiceInstance.getEmailSettings).toHaveBeenCalledTimes(1);
    expect(mockEmailSettingsForm).toHaveBeenCalledWith(
      expect.objectContaining({
        initialSettings: defaultFallback,
      }),
    );
  });
});
