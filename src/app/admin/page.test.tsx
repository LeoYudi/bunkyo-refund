import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRefundRequestsAction } from "@/actions/refund.actions";
import type { RefundRequest } from "@/models/refund.model";
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
} from "@/models/settings.model";
import { SettingsService } from "@/services/settings.service";
import AdminDashboardPage from "./page";

vi.mock("@/actions/refund.actions", () => ({
  getRefundRequestsAction: vi.fn(),
}));

vi.mock("@/services/settings.service", () => ({
  SettingsService: vi.fn(),
}));

vi.mock("@/components/ui/status-lifecycle", () => ({
  StatusLifecycle: () => (
    <div data-testid="mock-status-lifecycle">Status Lifecycle</div>
  ),
}));

const mockRequestsTable = vi.fn(
  ({
    requests,
    defaultEmailSettings,
  }: {
    requests: RefundRequest[];
    defaultEmailSettings?: EmailSettings;
  }) => (
    <div data-testid="mock-requests-table">
      <span>{requests.length}</span>
      <span>{defaultEmailSettings?.recipient_email}</span>
    </div>
  ),
);

vi.mock("@/components/ui/requests-table", () => ({
  RequestsTable: (props: {
    requests: RefundRequest[];
    defaultEmailSettings?: EmailSettings;
  }) => mockRequestsTable(props),
}));

describe("AdminDashboardPage", () => {
  const mockRequests: RefundRequest[] = [
    {
      id: "req-1",
      requester_name: "Alice Silva",
      status: "APPROVED",
      created_at: "2026-11-26T10:00:00Z",
      updated_at: "2026-11-26T10:00:00Z",
      description: "Almoço do evento",
      issue_date: "2026-11-26",
      issue_number: "NF-100",
      issuer_cnpj: "12.345.678/0001-90",
      issuer_name: "Restaurante Sabor",
      receipt_file_url: "https://example.com/receipt1.pdf",
      receiver_cnpj: null,
      reviewed_by: "admin-1",
      total_value: 150.5,
    },
  ];

  let mockServiceInstance: {
    getEmailSettings: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      getEmailSettings: vi.fn().mockResolvedValue({
        id: "default",
        ...DEFAULT_EMAIL_SETTINGS,
        updated_at: "2026-11-26T10:00:00Z",
      }),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(SettingsService).mockImplementation(function () {
      return mockServiceInstance as unknown as SettingsService;
    });
  });

  it("should load refund requests and email settings via SettingsService.getEmailSettings() and pass defaultEmailSettings to RequestsTable", async () => {
    const storedSettings: EmailSettings = {
      id: "settings-db-1",
      recipient_email: "tesouraria@bunkyo.org.br",
      cc_email: "presidente@bunkyo.org.br",
      bcc_email: "arquivo@bunkyo.org.br",
      subject_prefix: "Reembolso Eventos - ",
      default_event_description: "gastos com o Haru Matsuri 2026",
      greeting_text: "Olá pessoal da tesouraria,",
      intro_text_template:
        "Encaminho o pedido de reembolso referente aos {eventDescription}.",
      spreadsheet_text: "A planilha do evento foi preenchida no Google Drive.",
      approver_email: "aprovador.cjb@bunkyo.org.br",
      approval_request_text: "Favor validar e aprovar este lote.",
      closing_text: "Abraços,",
      sender_name: "Kenji Takahashi",
      sender_role: "Tesoureiro CJB - Gestão 2026",
      sender_email: "kenji@bunkyo.org.br",
      sender_phone: "(11) 99999-1234",
      updated_at: "2026-11-26T12:00:00Z",
    };

    vi.mocked(getRefundRequestsAction).mockResolvedValueOnce({
      success: true,
      data: mockRequests,
    });
    mockServiceInstance.getEmailSettings.mockResolvedValueOnce(storedSettings);

    const PageElement = await AdminDashboardPage();
    render(PageElement);

    expect(getRefundRequestsAction).toHaveBeenCalledTimes(1);
    expect(SettingsService).toHaveBeenCalledTimes(1);
    expect(mockServiceInstance.getEmailSettings).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mock-status-lifecycle")).toBeInTheDocument();
    expect(screen.getByTestId("mock-requests-table")).toBeInTheDocument();
    expect(mockRequestsTable).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: mockRequests,
        defaultEmailSettings: storedSettings,
      }),
    );
  });

  it("should pass fallback default email settings to RequestsTable when SettingsService returns defaults", async () => {
    const defaultFallback: EmailSettings = {
      id: "default",
      ...DEFAULT_EMAIL_SETTINGS,
      updated_at: "2026-11-26T12:00:00Z",
    };

    vi.mocked(getRefundRequestsAction).mockResolvedValueOnce({
      success: true,
      data: mockRequests,
    });
    mockServiceInstance.getEmailSettings.mockResolvedValueOnce(defaultFallback);

    const PageElement = await AdminDashboardPage();
    render(PageElement);

    expect(mockServiceInstance.getEmailSettings).toHaveBeenCalledTimes(1);
    expect(mockRequestsTable).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: mockRequests,
        defaultEmailSettings: defaultFallback,
      }),
    );
  });

  it("should render error message and not render RequestsTable when getRefundRequestsAction fails", async () => {
    vi.mocked(getRefundRequestsAction).mockResolvedValueOnce({
      success: false,
      error: "Falha ao buscar solicitações",
    });

    const PageElement = await AdminDashboardPage();
    render(PageElement);

    expect(
      screen.getByText(
        /Erro ao carregar solicitações:\s*Falha ao buscar solicitações/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("mock-requests-table")).not.toBeInTheDocument();
    expect(mockRequestsTable).not.toHaveBeenCalled();
  });
});
