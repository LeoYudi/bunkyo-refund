import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps, ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  processBatchReceiptsAction,
  processReceiptAction,
} from "@/actions/ai.actions";
import {
  exportToCsvAction,
  sendBatchPaymentEmailAction,
} from "@/actions/batch.actions";
import * as refundActions from "@/actions/refund.actions";
import type { Database } from "@/models/database.types";
import type { EmailSettings } from "@/models/settings.model";
import { RequestsTable } from "./requests-table";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

vi.mock("@/actions/ai.actions", () => ({
  processReceiptAction: vi.fn(),
  processBatchReceiptsAction: vi.fn(),
}));

vi.mock("@/actions/batch.actions", () => ({
  sendBatchPaymentEmailAction: vi.fn(),
  exportToCsvAction: vi.fn(),
}));

vi.mock("@/actions/refund.actions", () => ({
  updateRefundRequestAction: vi.fn(),
  deleteRefundRequestAction: vi.fn(),
  deleteBatchRefundRequestsAction: vi.fn(),
  markRefundAsPaidAction: vi.fn(),
  markBatchRefundsAsPaidAction: vi.fn(),
}));

const {
  updateRefundRequestAction,
  deleteRefundRequestAction,
  deleteBatchRefundRequestsAction,
  markRefundAsPaidAction,
  markBatchRefundsAsPaidAction,
} = refundActions as unknown as {
  updateRefundRequestAction: typeof refundActions.updateRefundRequestAction;
  deleteRefundRequestAction: typeof refundActions.deleteRefundRequestAction;
  deleteBatchRefundRequestsAction: (requestIds: string[]) => Promise<{
    success: boolean;
    data?: {
      succeeded: string[];
      failed: Array<{ id: string; error: string }>;
    };
    error?: string;
  }>;
  markRefundAsPaidAction: typeof refundActions.markRefundAsPaidAction;
  markBatchRefundsAsPaidAction: typeof refundActions.markBatchRefundsAsPaidAction;
};

type RefundRequest = Database["public"]["Tables"]["refund_requests"]["Row"];

describe("RequestsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(processReceiptAction).mockResolvedValue({ success: true });
    vi.mocked(processBatchReceiptsAction).mockResolvedValue({
      success: true,
      data: { succeeded: [], failed: [] },
    });
    vi.mocked(sendBatchPaymentEmailAction).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(exportToCsvAction).mockResolvedValue({
      success: true,
      csv: "\uFEFFID,Solicitante\nreq-1,Alice",
    });
    vi.mocked(updateRefundRequestAction).mockResolvedValue({
      success: true,
      data: {} as RefundRequest,
    });
    vi.mocked(deleteRefundRequestAction).mockResolvedValue({
      success: true,
    });
    vi.mocked(deleteBatchRefundRequestsAction).mockResolvedValue({
      success: true,
      data: { succeeded: [], failed: [] },
    });
    vi.mocked(markRefundAsPaidAction).mockResolvedValue({
      success: true,
      data: {} as RefundRequest,
    });
    vi.mocked(markBatchRefundsAsPaidAction).mockResolvedValue({
      success: true,
      data: { succeeded: [], failed: [] },
    });
  });

  it("should render table headers correctly without Anexo column", () => {
    render(<RequestsTable requests={[]} />);
    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Emissor")).toBeInTheDocument();
    expect(screen.getByText("CNPJ")).toBeInTheDocument();
    expect(screen.getByText("Valor Total")).toBeInTheDocument();
    expect(screen.getByText("Ações")).toBeInTheDocument();
    expect(screen.queryByText("Anexo")).not.toBeInTheDocument();
  });

  it("should render mock data correctly", () => {
    const mockRequests: RefundRequest[] = [
      {
        id: "1",
        requester_name: "Alice",
        status: "PENDING",
        created_at: new Date("2024-01-01T10:00:00Z").toISOString(),
        updated_at: new Date("2024-01-01T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "http://example.com/alice.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
      {
        id: "2",
        requester_name: "Bob",
        status: "APPROVED",
        created_at: new Date("2024-01-02T10:00:00Z").toISOString(),
        updated_at: new Date("2024-01-02T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
    ];

    render(<RequestsTable requests={mockRequests} />);

    // Should render names and statuses
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
  });

  describe("Row Actions DropdownMenu and ReceiptModal Integration", () => {
    const mockRequests: RefundRequest[] = [
      {
        id: "1",
        requester_name: "Alice",
        status: "PENDING",
        created_at: new Date("2024-01-01T10:00:00Z").toISOString(),
        updated_at: new Date("2024-01-01T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "http://example.com/alice.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
      {
        id: "2",
        requester_name: "Bob",
        status: "APPROVED",
        created_at: new Date("2024-01-02T10:00:00Z").toISOString(),
        updated_at: new Date("2024-01-02T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
    ];

    it("should disable the 3-dots action menu button when an APPROVED row has no receipt_file_url", () => {
      render(<RequestsTable requests={mockRequests} />);

      const actionButtons = screen.getAllByRole("button", {
        name: /abrir menu|ações/i,
      });
      expect(actionButtons).toHaveLength(2);
      expect(actionButtons[0]).not.toBeDisabled();
      expect(actionButtons[1]).toBeDisabled();
    });

    it("should open ReceiptModal with the correct URL when 'Visualizar Nota Fiscal' is clicked inside the 3-dots menu", () => {
      render(<RequestsTable requests={mockRequests} />);

      const actionButtons = screen.getAllByRole("button", {
        name: /abrir menu|ações/i,
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.click(actionButtons[0]);

      const viewReceiptOption = screen.getByRole("menuitem", {
        name: /visualizar nota fiscal/i,
      });
      fireEvent.click(viewReceiptOption);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      const iframe = screen.getByTitle("Comprovante") as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe("http://example.com/alice.pdf");
    });

    it("should show 'Ver Retorno da IA' in the 3-dots menu when raw_ai_response is present and open a modal with its content on click", () => {
      const rawJson = '{"issuer_name": null, "total_value": null}';
      const requestsWithAiResponse: RefundRequest[] = [
        {
          ...mockRequests[0],
          raw_ai_response: rawJson,
        },
      ];

      render(<RequestsTable requests={requestsWithAiResponse} />);

      const actionButton = screen.getByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButton);

      const viewAiResponseOption = screen.getByRole("menuitem", {
        name: /ver retorno da ia/i,
      });
      expect(viewAiResponseOption).toBeInTheDocument();

      fireEvent.click(viewAiResponseOption);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText(/retorno da ia \(gemini\)/i)).toBeInTheDocument();
      expect(screen.getByText(rawJson)).toBeInTheDocument();
    });

    it("should NOT show 'Ver Retorno da IA' in the 3-dots menu when raw_ai_response is null or empty", () => {
      const requestsWithoutAiResponse: RefundRequest[] = [
        {
          ...mockRequests[0],
          raw_ai_response: null,
        },
      ];

      render(<RequestsTable requests={requestsWithoutAiResponse} />);

      const actionButton = screen.getByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButton);

      expect(
        screen.queryByRole("menuitem", { name: /ver retorno da ia/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Phase 4 - Extracted Data and AI Actions Integration", () => {
    const mockDetailedRequests: RefundRequest[] = [
      {
        id: "req-1",
        requester_name: "Alice Silva",
        status: "PENDING",
        created_at: new Date("2026-09-25T10:00:00Z").toISOString(),
        updated_at: new Date("2026-09-25T10:00:00Z").toISOString(),
        description: "Almoço da equipe",
        issue_date: "2026-09-25",
        issue_number: "NF-100",
        issuer_cnpj: "12.345.678/0001-90",
        issuer_name: "Restaurante Sabor",
        receipt_file_url: "https://example.com/receipt1.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: 150.5,
      },
      {
        id: "req-2",
        requester_name: "Bob Santos",
        status: "APPROVED",
        created_at: new Date("2026-09-26T10:00:00Z").toISOString(),
        updated_at: new Date("2026-09-26T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/receipt2.pdf",
        receiver_cnpj: null,
        reviewed_by: "admin-1",
        total_value: null,
      },
      {
        id: "req-3",
        requester_name: "Carlos Mendes",
        status: "PROCESSING",
        created_at: new Date("2026-09-27T10:00:00Z").toISOString(),
        updated_at: new Date("2026-09-27T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/receipt3.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
      {
        id: "req-4",
        requester_name: "Daniel Lima",
        status: "DENIED",
        created_at: new Date("2026-09-28T10:00:00Z").toISOString(),
        updated_at: new Date("2026-09-28T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/receipt4.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
      {
        id: "req-5",
        requester_name: "Elena Ramos",
        status: "SENT",
        created_at: new Date("2026-09-29T10:00:00Z").toISOString(),
        updated_at: new Date("2026-09-29T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/receipt5.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
      {
        id: "req-6",
        requester_name: "Fabio Costa",
        status: "PAID",
        created_at: new Date("2026-09-30T10:00:00Z").toISOString(),
        updated_at: new Date("2026-09-30T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/receipt6.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
    ];

    it("should render new Phase 4 column headers: Emissor, CNPJ, Valor Total, and Ações", () => {
      render(<RequestsTable requests={[]} />);

      expect(screen.getByText("Emissor")).toBeInTheDocument();
      expect(screen.getByText("CNPJ")).toBeInTheDocument();
      expect(screen.getByText("Valor Total")).toBeInTheDocument();
      expect(screen.getByText("Ações")).toBeInTheDocument();
    });

    it("should render empty state cell spanning all 8 columns when requests is empty", () => {
      render(<RequestsTable requests={[]} />);

      const emptyCell = screen.getByText("Nenhuma solicitação encontrada.");
      expect(emptyCell).toHaveAttribute("colspan", "8");
    });

    it("should display extracted data (issuer_name, issuer_cnpj, total_value in BRL currency) and '-' for null values", () => {
      render(<RequestsTable requests={mockDetailedRequests} />);

      // Populated fields in req-1
      expect(screen.getByText("Restaurante Sabor")).toBeInTheDocument();
      expect(screen.getByText("12.345.678/0001-90")).toBeInTheDocument();
      expect(screen.getByText(/R\$\s*150,50/)).toBeInTheDocument();

      // Null fields in req-2 to req-6 should display "-"
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(15);
    });

    it("should show both 'Visualizar Nota Fiscal' and 'Aprovar para Leitura' in the 3-dots menu for a PENDING row with receipt_file_url", () => {
      render(<RequestsTable requests={mockDetailedRequests} />);

      const actionButtons = screen.getAllByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButtons[0]);

      expect(
        screen.getByRole("menuitem", { name: /visualizar nota fiscal/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /aprovar para leitura/i }),
      ).toBeInTheDocument();
    });

    it("should show 'Visualizar Nota Fiscal' and NOT show 'Aprovar para Leitura' in the 3-dots menu for an APPROVED row with receipt_file_url", () => {
      render(<RequestsTable requests={mockDetailedRequests} />);

      const actionButtons = screen.getAllByRole("button", {
        name: /abrir menu|ações/i,
      });
      // Index 1 is Bob Santos (APPROVED with receipt_file_url)
      fireEvent.click(actionButtons[1]);

      expect(
        screen.getByRole("menuitem", { name: /visualizar nota fiscal/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("menuitem", { name: /aprovar para leitura/i }),
      ).not.toBeInTheDocument();
    });

    it("should trigger onProcessRequest callback with request id when 'Aprovar para Leitura' menuitem is clicked", async () => {
      const onProcessRequestMock = vi.fn();

      render(
        <RequestsTable
          requests={mockDetailedRequests}
          onProcessRequest={onProcessRequestMock}
        />,
      );

      const actionButtons = screen.getAllByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButtons[0]);

      const approveItem = screen.getByRole("menuitem", {
        name: /aprovar para leitura/i,
      });
      await act(async () => {
        fireEvent.click(approveItem);
      });

      expect(onProcessRequestMock).toHaveBeenCalledTimes(1);
      expect(onProcessRequestMock).toHaveBeenCalledWith("req-1");
    });

    it("should call default processReceiptAction with request id when 'Aprovar para Leitura' menuitem is clicked and onProcessRequest is not provided", async () => {
      render(<RequestsTable requests={mockDetailedRequests} />);

      const actionButtons = screen.getAllByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButtons[0]);

      const approveItem = screen.getByRole("menuitem", {
        name: /aprovar para leitura/i,
      });
      await act(async () => {
        fireEvent.click(approveItem);
      });

      expect(processReceiptAction).toHaveBeenCalledTimes(1);
      expect(processReceiptAction).toHaveBeenCalledWith("req-1");
    });

    it("should display an error alert when processReceiptAction returns { success: false, error }", async () => {
      vi.mocked(processReceiptAction).mockResolvedValueOnce({
        success: false,
        error: "Falha ao processar nota fiscal",
      });

      render(<RequestsTable requests={mockDetailedRequests} />);

      const actionButtons = screen.getAllByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButtons[0]);

      const approveItem = screen.getByRole("menuitem", {
        name: /aprovar para leitura/i,
      });
      fireEvent.click(approveItem);

      const alert = await screen.findByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Falha ao processar nota fiscal");
    });
  });

  describe("Status Badges and Color Theory", () => {
    const createRequestWithStatus = (
      id: string,
      status: RefundRequest["status"],
    ): RefundRequest => ({
      id,
      requester_name: `User ${status}`,
      status,
      created_at: new Date("2026-10-01T10:00:00Z").toISOString(),
      updated_at: new Date("2026-10-01T10:00:00Z").toISOString(),
      description: null,
      issue_date: null,
      issue_number: null,
      issuer_cnpj: null,
      issuer_name: null,
      receipt_file_url: `https://example.com/${id}.pdf`,
      receiver_cnpj: null,
      reviewed_by: null,
      total_value: null,
    });

    it("should render PENDING status as a gray/neutral Badge with label 'Pendente'", () => {
      render(
        <RequestsTable requests={[createRequestWithStatus("1", "PENDING")]} />,
      );

      const badgeText = screen.getByText("Pendente");
      const badge = badgeText.closest('[data-slot="badge"]') ?? badgeText;
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge.className).toMatch(/gray|zinc|neutral|muted|slate/i);
    });

    it("should render PROCESSING status as a yellow/amber Badge with label 'Processando'", () => {
      render(
        <RequestsTable
          requests={[createRequestWithStatus("2", "PROCESSING")]}
        />,
      );

      const badgeText = screen.getByText("Processando");
      const badge = badgeText.closest('[data-slot="badge"]') ?? badgeText;
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge.className).toMatch(/amber|yellow/i);
    });

    it("should render APPROVED status as a blue Badge with label 'Aprovado'", () => {
      render(
        <RequestsTable requests={[createRequestWithStatus("3", "APPROVED")]} />,
      );

      const badgeText = screen.getByText("Aprovado");
      const badge = badgeText.closest('[data-slot="badge"]') ?? badgeText;
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge.className).toMatch(/blue/i);
    });

    it("should render DENIED status as a red/destructive Badge with label 'Negado'", () => {
      render(
        <RequestsTable requests={[createRequestWithStatus("4", "DENIED")]} />,
      );

      const badgeText = screen.getByText("Negado");
      const badge = badgeText.closest('[data-slot="badge"]') ?? badgeText;
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge.className).toMatch(/red|destructive/i);
    });

    it("should render SENT status as a purple/violet Badge with label 'Enviado'", () => {
      render(
        <RequestsTable requests={[createRequestWithStatus("5", "SENT")]} />,
      );

      const badgeText = screen.getByText("Enviado");
      const badge = badgeText.closest('[data-slot="badge"]') ?? badgeText;
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge.className).toMatch(/purple|violet/i);
    });

    it("should render PAID status as a green/emerald Badge with label 'Pago'", () => {
      render(
        <RequestsTable requests={[createRequestWithStatus("6", "PAID")]} />,
      );

      const badgeText = screen.getByText("Pago");
      const badge = badgeText.closest('[data-slot="badge"]') ?? badgeText;
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge.className).toMatch(/green|emerald/i);
    });

    it("should render all 6 status badges simultaneously without raw English enum strings", () => {
      const allStatusRequests: RefundRequest[] = [
        createRequestWithStatus("1", "PENDING"),
        createRequestWithStatus("2", "PROCESSING"),
        createRequestWithStatus("3", "APPROVED"),
        createRequestWithStatus("4", "DENIED"),
        createRequestWithStatus("5", "SENT"),
        createRequestWithStatus("6", "PAID"),
      ];

      const { container } = render(
        <RequestsTable requests={allStatusRequests} />,
      );

      const badges = container.querySelectorAll('[data-slot="badge"]');
      expect(badges).toHaveLength(6);

      expect(screen.queryByText("PENDING")).not.toBeInTheDocument();
      expect(screen.queryByText("PROCESSING")).not.toBeInTheDocument();
      expect(screen.queryByText("APPROVED")).not.toBeInTheDocument();
      expect(screen.queryByText("DENIED")).not.toBeInTheDocument();
      expect(screen.queryByText("SENT")).not.toBeInTheDocument();
      expect(screen.queryByText("PAID")).not.toBeInTheDocument();
    });
  });

  describe("Bulk Selection and BatchPaymentDialog", () => {
    const bulkMockRequests: RefundRequest[] = [
      {
        id: "req-pending",
        requester_name: "Alice Pendente",
        status: "PENDING",
        created_at: new Date("2026-10-01T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-01T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/1.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: 100.0,
      },
      {
        id: "req-approved-1",
        requester_name: "Bruno Aprovado",
        status: "APPROVED",
        created_at: new Date("2026-10-02T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-02T10:00:00Z").toISOString(),
        description: "Material de escritório",
        issue_date: "2026-10-02",
        issue_number: "NF-201",
        issuer_cnpj: "12.345.678/0001-90",
        issuer_name: "Papelaria Central",
        receipt_file_url: "https://example.com/2.pdf",
        receiver_cnpj: null,
        reviewed_by: "admin-1",
        total_value: 250.75,
      },
      {
        id: "req-approved-2",
        requester_name: "Carla Aprovada",
        status: "APPROVED",
        created_at: new Date("2026-10-03T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-03T10:00:00Z").toISOString(),
        description: "Hospedagem evento",
        issue_date: "2026-10-03",
        issue_number: "NF-202",
        issuer_cnpj: "98.765.432/0001-10",
        issuer_name: "Hotel Sol",
        receipt_file_url: "https://example.com/3.pdf",
        receiver_cnpj: null,
        reviewed_by: "admin-1",
        total_value: 349.25,
      },
      {
        id: "req-processing",
        requester_name: "Diego Processando",
        status: "PROCESSING",
        created_at: new Date("2026-10-04T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-04T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/4.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
      {
        id: "req-denied",
        requester_name: "Eduarda Negada",
        status: "DENIED",
        created_at: new Date("2026-10-05T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-05T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/5.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
      {
        id: "req-sent",
        requester_name: "Felipe Enviado",
        status: "SENT",
        created_at: new Date("2026-10-06T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-06T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/6.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: 80.0,
      },
      {
        id: "req-paid",
        requester_name: "Gabriela Paga",
        status: "PAID",
        created_at: new Date("2026-10-07T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-07T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/7.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: 120.0,
      },
    ];

    it("should render row checkboxes and a header select-all checkbox", () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const selectAllCheckbox = screen.getByRole("checkbox", {
        name: /selecionar todas as solicitações/i,
      });
      expect(selectAllCheckbox).toBeInTheDocument();

      const allCheckboxes = screen.getAllByRole("checkbox");
      // 1 header checkbox + 7 row checkboxes
      expect(allCheckboxes).toHaveLength(8);
    });

    it("should enable checkboxes for all request statuses (PENDING, APPROVED, PROCESSING, DENIED, SENT, and PAID)", () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const allCheckboxes = screen.getAllByRole("checkbox");
      // Index 0 is header checkbox; indices 1..7 correspond to bulkMockRequests[0..6]
      const [
        ,
        pendingCb,
        approved1Cb,
        approved2Cb,
        processingCb,
        deniedCb,
        sentCb,
        paidCb,
      ] = allCheckboxes;

      expect(pendingCb).not.toBeDisabled();
      expect(approved1Cb).not.toBeDisabled();
      expect(approved2Cb).not.toBeDisabled();
      expect(processingCb).not.toBeDisabled();
      expect(deniedCb).not.toBeDisabled();
      expect(sentCb).not.toBeDisabled();
      expect(paidCb).not.toBeDisabled();
    });

    it("should select all rows across all statuses when clicking header select-all checkbox", () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const selectAllCheckbox = screen.getByRole("checkbox", {
        name: /selecionar todas as solicitações/i,
      });
      expect(selectAllCheckbox).not.toBeDisabled();

      fireEvent.click(selectAllCheckbox);
      expect(screen.getByText(/7 selecionado\(s\)/i)).toBeInTheDocument();

      fireEvent.click(selectAllCheckbox);
      expect(screen.getByText(/0 selecionado\(s\)/i)).toBeInTheDocument();
    });

    it("should display the top action bar with '0 selecionado(s)' and both 'Aprovar para Leitura em Lote' and 'Enviar Pagamentos em Lote' buttons disabled initially", () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      expect(screen.getByText(/0 selecionado\(s\)/i)).toBeInTheDocument();

      const batchApproveButton = screen.getByRole("button", {
        name: /aprovar para leitura em lote/i,
      });
      expect(batchApproveButton).toBeInTheDocument();
      expect(batchApproveButton).toBeDisabled();

      const batchPaymentButton = screen.getByRole("button", {
        name: /enviar pagamentos em lote/i,
      });
      expect(batchPaymentButton).toBeInTheDocument();
      expect(batchPaymentButton).toBeDisabled();
    });

    it("should enable 'Aprovar para Leitura em Lote' and keep 'Enviar Pagamentos em Lote' disabled when only a PENDING row is selected", () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const allCheckboxes = screen.getAllByRole("checkbox");
      const pendingCb = allCheckboxes[1];

      fireEvent.click(pendingCb);

      expect(screen.getByText(/1 selecionado\(s\)/i)).toBeInTheDocument();

      const batchApproveButton = screen.getByRole("button", {
        name: /aprovar para leitura em lote/i,
      });
      const batchPaymentButton = screen.getByRole("button", {
        name: /enviar pagamentos em lote/i,
      });

      expect(batchApproveButton).not.toBeDisabled();
      expect(batchPaymentButton).toBeDisabled();
    });

    it("should enable 'Enviar Pagamentos em Lote' and keep 'Aprovar para Leitura em Lote' disabled when only an APPROVED row is selected", () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const allCheckboxes = screen.getAllByRole("checkbox");
      const approved1Cb = allCheckboxes[2];

      fireEvent.click(approved1Cb);

      expect(screen.getByText(/1 selecionado\(s\)/i)).toBeInTheDocument();

      const batchApproveButton = screen.getByRole("button", {
        name: /aprovar para leitura em lote/i,
      });
      const batchPaymentButton = screen.getByRole("button", {
        name: /enviar pagamentos em lote/i,
      });

      expect(batchPaymentButton).not.toBeDisabled();
      expect(batchApproveButton).toBeDisabled();
    });

    it("should keep 'Aprovar para Leitura em Lote' and 'Enviar Pagamentos em Lote' disabled while enabling 'Excluir Selecionados' when PROCESSING, DENIED, SENT, or PAID rows are selected", () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const allCheckboxes = screen.getAllByRole("checkbox");
      const processingCb = allCheckboxes[4];
      const deniedCb = allCheckboxes[5];
      const sentCb = allCheckboxes[6];
      const paidCb = allCheckboxes[7];

      fireEvent.click(processingCb);
      fireEvent.click(deniedCb);
      fireEvent.click(sentCb);
      fireEvent.click(paidCb);

      expect(screen.getByText(/4 selecionado\(s\)/i)).toBeInTheDocument();

      const batchApproveButton = screen.getByRole("button", {
        name: /aprovar para leitura em lote/i,
      });
      const batchPaymentButton = screen.getByRole("button", {
        name: /enviar pagamentos em lote/i,
      });
      const bulkDeleteButton = screen.getByRole("button", {
        name: /excluir selecionados/i,
      });

      expect(batchApproveButton).toBeDisabled();
      expect(batchPaymentButton).toBeDisabled();
      expect(bulkDeleteButton).not.toBeDisabled();
    });

    it("should call processBatchReceiptsAction with only selected PENDING request IDs when both PENDING and APPROVED rows are selected and 'Aprovar para Leitura em Lote' is clicked", async () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const allCheckboxes = screen.getAllByRole("checkbox");
      const pendingCb = allCheckboxes[1];
      const approved1Cb = allCheckboxes[2];

      fireEvent.click(pendingCb);
      fireEvent.click(approved1Cb);

      expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();

      const batchApproveButton = screen.getByRole("button", {
        name: /aprovar para leitura em lote/i,
      });
      await act(async () => {
        fireEvent.click(batchApproveButton);
      });

      expect(processBatchReceiptsAction).toHaveBeenCalledTimes(1);
      expect(processBatchReceiptsAction).toHaveBeenCalledWith(["req-pending"]);
    });

    it("should open BatchPaymentDialog containing only selected APPROVED requests when both PENDING and APPROVED rows are selected and 'Enviar Pagamentos em Lote' is clicked", () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const allCheckboxes = screen.getAllByRole("checkbox");
      const pendingCb = allCheckboxes[1];
      const approved1Cb = allCheckboxes[2];
      const approved2Cb = allCheckboxes[3];

      fireEvent.click(pendingCb);
      fireEvent.click(approved1Cb);
      fireEvent.click(approved2Cb);

      expect(screen.getByText(/3 selecionado\(s\)/i)).toBeInTheDocument();

      const batchPaymentButton = screen.getByRole("button", {
        name: /enviar pagamentos em lote/i,
      });
      fireEvent.click(batchPaymentButton);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(
        screen.getByText(/2 solicitaç(ões|oes) selecionadas/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/R\$\s*600,00/)).toBeInTheDocument();
    });

    it("should render 'Exportar CSV' button disabled initially, enable it when any request is selected, and call exportToCsvAction with selectedIds when clicked", async () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const exportCsvButton = screen.getByRole("button", {
        name: /exportar csv/i,
      });
      expect(exportCsvButton).toBeInTheDocument();
      expect(exportCsvButton).toBeDisabled();

      const allCheckboxes = screen.getAllByRole("checkbox");
      const pendingCb = allCheckboxes[1];
      const approved1Cb = allCheckboxes[2];

      fireEvent.click(pendingCb);
      expect(exportCsvButton).not.toBeDisabled();

      fireEvent.click(approved1Cb);
      await act(async () => {
        fireEvent.click(exportCsvButton);
      });

      expect(exportToCsvAction).toHaveBeenCalledTimes(1);
      expect(exportToCsvAction).toHaveBeenCalledWith([
        "req-pending",
        "req-approved-1",
      ]);
    });

    it("should call sendBatchPaymentEmailAction with selected APPROVED request IDs, recipientEmail, cc, and bcc when confirming inside BatchPaymentDialog (without onConfirmBatch prop)", async () => {
      render(<RequestsTable requests={bulkMockRequests} />);

      const allCheckboxes = screen.getAllByRole("checkbox");
      const pendingCb = allCheckboxes[1];
      const approved1Cb = allCheckboxes[2];
      const approved2Cb = allCheckboxes[3];

      fireEvent.click(pendingCb);
      fireEvent.click(approved1Cb);
      fireEvent.click(approved2Cb);

      const batchPaymentButton = screen.getByRole("button", {
        name: /enviar pagamentos em lote/i,
      });
      fireEvent.click(batchPaymentButton);

      const emailInput = screen.getByPlaceholderText(
        /e-mail|destinatário|financeiro/i,
      );
      const ccInput = screen.getByLabelText(/Cc \(Cópia\)/i);
      const bccInput = screen.getByLabelText(/Cco \(Cópia Oculta\)/i);

      fireEvent.change(emailInput, {
        target: { value: "financeiro@bunkyo.org.br" },
      });
      fireEvent.change(ccInput, {
        target: { value: "cc@bunkyo.org.br" },
      });
      fireEvent.change(bccInput, {
        target: { value: "bcc@bunkyo.org.br" },
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirmar envio/i,
      });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      expect(sendBatchPaymentEmailAction).toHaveBeenCalledTimes(1);
      expect(sendBatchPaymentEmailAction).toHaveBeenCalledWith(
        ["req-approved-1", "req-approved-2"],
        "financeiro@bunkyo.org.br",
        "cc@bunkyo.org.br",
        "bcc@bunkyo.org.br",
      );
    });

    it("should redirect to /login?reason=google_session_expired without throwing when sendBatchPaymentEmailAction returns sessionExpired: true", async () => {
      vi.mocked(sendBatchPaymentEmailAction).mockResolvedValueOnce({
        success: false,
        error: "Sessão do Google expirada. Faça login novamente.",
        sessionExpired: true,
      } as Awaited<ReturnType<typeof sendBatchPaymentEmailAction>>);

      render(<RequestsTable requests={bulkMockRequests} />);

      const allCheckboxes = screen.getAllByRole("checkbox");
      const approved1Cb = allCheckboxes[2];
      fireEvent.click(approved1Cb);

      const batchPaymentButton = screen.getByRole("button", {
        name: /enviar pagamentos em lote/i,
      });
      fireEvent.click(batchPaymentButton);

      const confirmButton = screen.getByRole("button", {
        name: /confirmar envio/i,
      });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      expect(sendBatchPaymentEmailAction).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(
        "/login?reason=google_session_expired",
      );
    });

    it("should open BatchPaymentDialog pre-filled with all custom defaultEmailSettings fields when an APPROVED request is selected and 'Enviar Pagamentos em Lote' is clicked", () => {
      const customSettings: EmailSettings = {
        id: "settings-custom-1",
        recipient_email: "tesouraria@bunkyo.org.br",
        cc_email: "presidente@bunkyo.org.br",
        bcc_email: "arquivo@bunkyo.org.br",
        subject_prefix: "Reembolso Eventos - ",
        default_event_description: "gastos com o Haru Matsuri 2026",
        greeting_text: "Olá pessoal da tesouraria,",
        intro_text_template:
          "Encaminho o pedido de reembolso referente aos {eventDescription}.",
        spreadsheet_text:
          "A planilha do evento foi preenchida no Google Drive.",
        approver_email: "aprovador.cjb@bunkyo.org.br",
        approval_request_text: "Favor validar e aprovar este lote.",
        closing_text: "Abraços,",
        sender_name: "Kenji Takahashi",
        sender_role: "Tesoureiro CJB - Gestão 2026",
        sender_email: "kenji@bunkyo.org.br",
        sender_phone: "(11) 99999-1234",
        updated_at: "2026-11-26T10:00:00Z",
      };

      render(
        <RequestsTable
          requests={bulkMockRequests}
          defaultEmailSettings={customSettings}
        />,
      );

      const approvedCb = screen.getByRole("checkbox", {
        name: /Bruno Aprovado/i,
      });
      fireEvent.click(approvedCb);

      const batchPaymentButton = screen.getByRole("button", {
        name: /enviar pagamentos em lote/i,
      });
      fireEvent.click(batchPaymentButton);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      expect(
        within(dialog).getByLabelText(/E-mail do Financeiro/i),
      ).toHaveValue(customSettings.recipient_email);
      expect(within(dialog).getByLabelText(/Cc \(Cópia\)/i)).toHaveValue(
        customSettings.cc_email,
      );
      expect(
        within(dialog).getByLabelText(/Cco \(Cópia Oculta\)/i),
      ).toHaveValue(customSettings.bcc_email);
      expect(within(dialog).getByLabelText(/Assunto/i)).toHaveValue(
        customSettings.subject_prefix,
      );
      expect(within(dialog).getByLabelText(/Descrição do Evento/i)).toHaveValue(
        customSettings.default_event_description,
      );
      expect(
        within(dialog).getByLabelText(/E-mail para Aprovação/i),
      ).toHaveValue(customSettings.approver_email);
      expect(within(dialog).getByLabelText(/Nome na Assinatura/i)).toHaveValue(
        customSettings.sender_name,
      );
      expect(within(dialog).getByLabelText(/Cargo na Assinatura/i)).toHaveValue(
        customSettings.sender_role,
      );
      expect(
        within(dialog).getByLabelText(/E-mail na Assinatura/i),
      ).toHaveValue(customSettings.sender_email);
      expect(
        within(dialog).getByLabelText(/Telefone na Assinatura/i),
      ).toHaveValue(customSettings.sender_phone);
    });
  });

  describe("Phase 7 - Edit and Delete Refund Requests", () => {
    const mockRequest: RefundRequest = {
      id: "req-phase7-1",
      requester_name: "Daniel Tanaka",
      status: "APPROVED",
      created_at: new Date("2026-10-28T10:00:00Z").toISOString(),
      updated_at: new Date("2026-10-28T10:00:00Z").toISOString(),
      description: "Despesa evento",
      issue_date: "2026-10-28",
      issue_number: "NF-555",
      issuer_cnpj: "12.345.678/0001-90",
      issuer_name: "Loja ABC",
      receipt_file_url: "https://example.com/receipt.pdf",
      receiver_cnpj: null,
      reviewed_by: "admin-1",
      total_value: 350.0,
    };

    it("should render 'Editar' and 'Excluir' options in the 3-dots menu", () => {
      render(<RequestsTable requests={[mockRequest]} />);

      const actionButton = screen.getByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButton);

      expect(
        screen.getByRole("menuitem", { name: /editar/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /excluir/i }),
      ).toBeInTheDocument();
    });

    it("should open EditRefundDialog when clicking 'Editar' in the 3-dots menu", () => {
      render(<RequestsTable requests={[mockRequest]} />);

      const actionButton = screen.getByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButton);

      const editOption = screen.getByRole("menuitem", { name: /editar/i });
      fireEvent.click(editOption);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/editar solicita/i)).toBeInTheDocument();
    });

    it("should open DeleteRefundDialog when clicking 'Excluir' in the 3-dots menu", () => {
      render(<RequestsTable requests={[mockRequest]} />);

      const actionButton = screen.getByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButton);

      const deleteOption = screen.getByRole("menuitem", { name: /excluir/i });
      fireEvent.click(deleteOption);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/excluir solicita/i)).toBeInTheDocument();
    });
  });

  describe("Bulk Delete with Confirmation Modal", () => {
    const bulkDeleteMockRequests: RefundRequest[] = [
      {
        id: "req-pending",
        requester_name: "Alice Pendente",
        status: "PENDING",
        created_at: new Date("2026-10-01T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-01T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/1.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: 100.0,
      },
      {
        id: "req-approved",
        requester_name: "Bruno Aprovado",
        status: "APPROVED",
        created_at: new Date("2026-10-02T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-02T10:00:00Z").toISOString(),
        description: "Despesa aprovada",
        issue_date: "2026-10-02",
        issue_number: "NF-201",
        issuer_cnpj: "12.345.678/0001-90",
        issuer_name: "Papelaria Central",
        receipt_file_url: "https://example.com/2.pdf",
        receiver_cnpj: null,
        reviewed_by: "admin-1",
        total_value: 250.0,
      },
      {
        id: "req-processing",
        requester_name: "Diego Processando",
        status: "PROCESSING",
        created_at: new Date("2026-10-03T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-03T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/3.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
      {
        id: "req-denied",
        requester_name: "Eduarda Negada",
        status: "DENIED",
        created_at: new Date("2026-10-04T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-04T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/4.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: null,
      },
      {
        id: "req-sent",
        requester_name: "Felipe Enviado",
        status: "SENT",
        created_at: new Date("2026-10-05T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-05T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/5.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: 80.0,
      },
      {
        id: "req-paid",
        requester_name: "Gabriela Paga",
        status: "PAID",
        created_at: new Date("2026-10-06T10:00:00Z").toISOString(),
        updated_at: new Date("2026-10-06T10:00:00Z").toISOString(),
        description: null,
        issue_date: null,
        issue_number: null,
        issuer_cnpj: null,
        issuer_name: null,
        receipt_file_url: "https://example.com/6.pdf",
        receiver_cnpj: null,
        reviewed_by: null,
        total_value: 120.0,
      },
    ];

    type RequestsTableWithBulkDelete = ComponentType<
      ComponentProps<typeof RequestsTable> & {
        onDeleteBatch?: (requestIds: string[]) => Promise<void> | void;
      }
    >;

    it("should render 'Excluir Selecionados' button in the top bar disabled initially when 0 selecionado(s)", () => {
      render(<RequestsTable requests={bulkDeleteMockRequests} />);

      expect(screen.getByText(/0 selecionado\(s\)/i)).toBeInTheDocument();
      const bulkDeleteButton = screen.getByRole("button", {
        name: /excluir selecionados/i,
      });
      expect(bulkDeleteButton).toBeInTheDocument();
      expect(bulkDeleteButton).toBeDisabled();
    });

    it("should enable 'Excluir Selecionados' button when 1 or more requests of any status (e.g. SENT and PAID) are selected", () => {
      render(<RequestsTable requests={bulkDeleteMockRequests} />);

      const bulkDeleteButton = screen.getByRole("button", {
        name: /excluir selecionados/i,
      });
      expect(bulkDeleteButton).toBeDisabled();

      const sentCb = screen.getByRole("checkbox", { name: /Felipe Enviado/i });
      const paidCb = screen.getByRole("checkbox", { name: /Gabriela Paga/i });

      fireEvent.click(sentCb);
      expect(screen.getByText(/1 selecionado\(s\)/i)).toBeInTheDocument();
      expect(bulkDeleteButton).not.toBeDisabled();

      fireEvent.click(paidCb);
      expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();
      expect(bulkDeleteButton).not.toBeDisabled();
    });

    it("should open a confirmation modal showing the count of requests to be permanently deleted when clicking 'Excluir Selecionados'", () => {
      render(<RequestsTable requests={bulkDeleteMockRequests} />);

      fireEvent.click(
        screen.getByRole("checkbox", { name: /Felipe Enviado/i }),
      );
      fireEvent.click(screen.getByRole("checkbox", { name: /Gabriela Paga/i }));

      fireEvent.click(
        screen.getByRole("button", { name: /excluir selecionados/i }),
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog.textContent).toMatch(/\b2\b/);
      expect(dialog.textContent).toMatch(
        /permanente|irreversível|não pode ser desfeita/i,
      );
    });

    it("should close the confirmation modal without calling deleteBatchRefundRequestsAction or onDeleteBatch when clicking cancel", () => {
      const onDeleteBatchMock = vi.fn();
      const Table = RequestsTable as RequestsTableWithBulkDelete;

      render(
        <Table
          requests={bulkDeleteMockRequests}
          onDeleteBatch={onDeleteBatchMock}
        />,
      );

      fireEvent.click(
        screen.getByRole("checkbox", { name: /Felipe Enviado/i }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: /excluir selecionados/i }),
      );

      const dialog = screen.getByRole("dialog");
      const cancelButton = within(dialog).getByRole("button", {
        name: /cancelar/i,
      });
      fireEvent.click(cancelButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(deleteBatchRefundRequestsAction).not.toHaveBeenCalled();
      expect(onDeleteBatchMock).not.toHaveBeenCalled();
    });

    it("should call deleteBatchRefundRequestsAction(selectedIds), clear deleted IDs from selection, and close the modal on confirm without onDeleteBatch prop", async () => {
      vi.mocked(deleteBatchRefundRequestsAction).mockResolvedValueOnce({
        success: true,
        data: { succeeded: ["req-sent", "req-paid"], failed: [] },
      });

      render(<RequestsTable requests={bulkDeleteMockRequests} />);

      fireEvent.click(
        screen.getByRole("checkbox", { name: /Felipe Enviado/i }),
      );
      fireEvent.click(screen.getByRole("checkbox", { name: /Gabriela Paga/i }));
      expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: /excluir selecionados/i }),
      );

      const dialog = screen.getByRole("dialog");
      const confirmButton = within(dialog).getByRole("button", {
        name: /excluir|confirmar/i,
      });

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      expect(deleteBatchRefundRequestsAction).toHaveBeenCalledTimes(1);
      expect(deleteBatchRefundRequestsAction).toHaveBeenCalledWith([
        "req-sent",
        "req-paid",
      ]);
      expect(screen.getByText(/0 selecionado\(s\)/i)).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should call onDeleteBatch(selectedIds), clear selection, and close the modal on confirm when onDeleteBatch prop is provided", async () => {
      const onDeleteBatchMock = vi.fn().mockResolvedValue(undefined);
      const Table = RequestsTable as RequestsTableWithBulkDelete;

      render(
        <Table
          requests={bulkDeleteMockRequests}
          onDeleteBatch={onDeleteBatchMock}
        />,
      );

      fireEvent.click(
        screen.getByRole("checkbox", { name: /Eduarda Negada/i }),
      );
      fireEvent.click(screen.getByRole("checkbox", { name: /Gabriela Paga/i }));
      expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: /excluir selecionados/i }),
      );

      const dialog = screen.getByRole("dialog");
      const confirmButton = within(dialog).getByRole("button", {
        name: /excluir|confirmar/i,
      });

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      expect(onDeleteBatchMock).toHaveBeenCalledTimes(1);
      expect(onDeleteBatchMock).toHaveBeenCalledWith([
        "req-denied",
        "req-paid",
      ]);
      expect(deleteBatchRefundRequestsAction).not.toHaveBeenCalled();
      expect(screen.getByText(/0 selecionado\(s\)/i)).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should display error alert (role='alert') and remove only succeeded IDs from selection when deleteBatchRefundRequestsAction returns partial failure", async () => {
      vi.mocked(deleteBatchRefundRequestsAction).mockResolvedValueOnce({
        success: false,
        data: {
          succeeded: ["req-sent"],
          failed: [{ id: "req-paid", error: "Erro ao deletar req-paid" }],
        },
        error: "Falha ao excluir 1 solicitação(ões): Erro ao deletar req-paid",
      });

      render(<RequestsTable requests={bulkDeleteMockRequests} />);

      const sentCb = screen.getByRole("checkbox", { name: /Felipe Enviado/i });
      const paidCb = screen.getByRole("checkbox", { name: /Gabriela Paga/i });

      fireEvent.click(sentCb);
      fireEvent.click(paidCb);
      expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: /excluir selecionados/i }),
      );

      const dialog = screen.getByRole("dialog");
      const confirmButton = within(dialog).getByRole("button", {
        name: /excluir|confirmar/i,
      });

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      const alert = await screen.findByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/falha ao excluir 1 solicitação/i);
      expect(screen.getByText(/1 selecionado\(s\)/i)).toBeInTheDocument();
      expect(sentCb).not.toBeChecked();
      expect(paidCb).toBeChecked();
    });

    it("should display error alert (role='alert') and keep all selected IDs when deleteBatchRefundRequestsAction returns an error without data", async () => {
      vi.mocked(deleteBatchRefundRequestsAction).mockResolvedValueOnce({
        success: false,
        error: "Erro inesperado ao excluir solicitações",
      });

      render(<RequestsTable requests={bulkDeleteMockRequests} />);

      const sentCb = screen.getByRole("checkbox", { name: /Felipe Enviado/i });
      const paidCb = screen.getByRole("checkbox", { name: /Gabriela Paga/i });

      fireEvent.click(sentCb);
      fireEvent.click(paidCb);

      fireEvent.click(
        screen.getByRole("button", { name: /excluir selecionados/i }),
      );

      const dialog = screen.getByRole("dialog");
      const confirmButton = within(dialog).getByRole("button", {
        name: /excluir|confirmar/i,
      });

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      const alert = await screen.findByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "Erro inesperado ao excluir solicitações",
      );
      expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();
      expect(sentCb).toBeChecked();
      expect(paidCb).toBeChecked();
    });
  });

  describe("Mark Refunds as Paid (Individual & Batch)", () => {
    const createMockRequest = (
      id: string,
      requesterName: string,
      status: RefundRequest["status"],
      receiptUrl = `https://example.com/${id}.pdf`,
    ): RefundRequest => ({
      id,
      requester_name: requesterName,
      status,
      created_at: new Date("2026-10-10T10:00:00Z").toISOString(),
      updated_at: new Date("2026-10-10T10:00:00Z").toISOString(),
      description: null,
      issue_date: null,
      issue_number: null,
      issuer_cnpj: null,
      issuer_name: null,
      receipt_file_url: receiptUrl,
      receiver_cnpj: null,
      reviewed_by: "admin-1",
      total_value: 100.0,
    });

    const markPaidMockRequests: RefundRequest[] = [
      createMockRequest("req-pending", "Alice Pendente", "PENDING"),
      createMockRequest("req-processing", "Diego Processando", "PROCESSING"),
      createMockRequest("req-approved", "Bruno Aprovado", "APPROVED"),
      createMockRequest("req-denied", "Eduarda Negada", "DENIED"),
      createMockRequest("req-sent-1", "Felipe Enviado", "SENT"),
      createMockRequest("req-sent-2", "Helena Enviada", "SENT"),
      createMockRequest("req-paid", "Gabriela Paga", "PAID"),
    ];

    describe("Individual Action (3-dots menu)", () => {
      it("should show 'Marcar como Pago' menuitem inside the 3-dots menu for a SENT request", () => {
        render(<RequestsTable requests={[markPaidMockRequests[4]]} />);

        const actionButton = screen.getByRole("button", {
          name: /abrir menu de ações para Felipe Enviado/i,
        });
        fireEvent.click(actionButton);

        expect(
          screen.getByRole("menuitem", { name: /marcar como pago/i }),
        ).toBeInTheDocument();
      });

      it("should enable the 3-dots menu button and show 'Marcar como Pago' for a SENT request even when receipt_file_url is empty", () => {
        const sentWithoutReceipt = createMockRequest(
          "req-sent-no-url",
          "Igor Enviado",
          "SENT",
          "",
        );
        render(<RequestsTable requests={[sentWithoutReceipt]} />);

        const actionButton = screen.getByRole("button", {
          name: /abrir menu de ações para Igor Enviado/i,
        });
        expect(actionButton).not.toBeDisabled();

        fireEvent.click(actionButton);
        expect(
          screen.getByRole("menuitem", { name: /marcar como pago/i }),
        ).toBeInTheDocument();
      });

      it.each(["PENDING", "PROCESSING", "APPROVED", "DENIED", "PAID"] as const)(
        "should NOT show 'Marcar como Pago' in the 3-dots menu when status is %s",
        (status) => {
          const req = createMockRequest(
            `req-${status.toLowerCase()}`,
            `User ${status}`,
            status,
          );
          render(<RequestsTable requests={[req]} />);

          const actionButton = screen.getByRole("button", {
            name: new RegExp(`abrir menu de ações para User ${status}`, "i"),
          });
          fireEvent.click(actionButton);

          expect(
            screen.queryByRole("menuitem", { name: /marcar como pago/i }),
          ).not.toBeInTheDocument();
        },
      );

      it("should call markRefundAsPaidAction(req.id) directly without opening a modal when 'Marcar como Pago' is clicked", async () => {
        const sentReq = markPaidMockRequests[4];
        vi.mocked(markRefundAsPaidAction).mockResolvedValueOnce({
          success: true,
          data: { ...sentReq, status: "PAID" },
        });

        render(<RequestsTable requests={[sentReq]} />);

        fireEvent.click(
          screen.getByRole("button", {
            name: /abrir menu de ações para Felipe Enviado/i,
          }),
        );

        const markPaidItem = screen.getByRole("menuitem", {
          name: /marcar como pago/i,
        });

        await act(async () => {
          fireEvent.click(markPaidItem);
        });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(markRefundAsPaidAction).toHaveBeenCalledTimes(1);
        expect(markRefundAsPaidAction).toHaveBeenCalledWith("req-sent-1");
      });

      it("should call onMarkAsPaid(req.id) directly without opening a modal or calling markRefundAsPaidAction when onMarkAsPaid prop is provided", async () => {
        const sentReq = markPaidMockRequests[4];
        const onMarkAsPaidMock = vi.fn().mockResolvedValue(undefined);

        render(
          <RequestsTable
            requests={[sentReq]}
            onMarkAsPaid={onMarkAsPaidMock}
          />,
        );

        fireEvent.click(
          screen.getByRole("button", {
            name: /abrir menu de ações para Felipe Enviado/i,
          }),
        );

        const markPaidItem = screen.getByRole("menuitem", {
          name: /marcar como pago/i,
        });

        await act(async () => {
          fireEvent.click(markPaidItem);
        });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(onMarkAsPaidMock).toHaveBeenCalledTimes(1);
        expect(onMarkAsPaidMock).toHaveBeenCalledWith("req-sent-1");
        expect(markRefundAsPaidAction).not.toHaveBeenCalled();
      });

      it("should show loading state (disable row action trigger) while markRefundAsPaidAction is pending and re-enable when finished", async () => {
        const sentReq = markPaidMockRequests[4];
        let resolvePromise!: (value: {
          success: true;
          data: RefundRequest;
        }) => void;
        const pendingPromise = new Promise<{
          success: true;
          data: RefundRequest;
        }>((resolve) => {
          resolvePromise = resolve;
        });

        vi.mocked(markRefundAsPaidAction).mockReturnValueOnce(pendingPromise);

        render(<RequestsTable requests={[sentReq]} />);

        const actionButton = screen.getByRole("button", {
          name: /abrir menu de ações para Felipe Enviado/i,
        });
        fireEvent.click(actionButton);

        const markPaidItem = screen.getByRole("menuitem", {
          name: /marcar como pago/i,
        });
        fireEvent.click(markPaidItem);

        expect(actionButton).toBeDisabled();

        await act(async () => {
          resolvePromise({
            success: true,
            data: { ...sentReq, status: "PAID" },
          });
        });

        expect(actionButton).not.toBeDisabled();
      });

      it("should display an error alert (role='alert') when markRefundAsPaidAction returns { success: false, error }", async () => {
        const sentReq = markPaidMockRequests[4];
        vi.mocked(markRefundAsPaidAction).mockResolvedValueOnce({
          success: false,
          error:
            "Apenas solicitações com status Enviado (SENT) podem ser marcadas como pagas",
        });

        render(<RequestsTable requests={[sentReq]} />);

        fireEvent.click(
          screen.getByRole("button", {
            name: /abrir menu de ações para Felipe Enviado/i,
          }),
        );

        const markPaidItem = screen.getByRole("menuitem", {
          name: /marcar como pago/i,
        });

        await act(async () => {
          fireEvent.click(markPaidItem);
        });

        const alert = await screen.findByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(
          "Apenas solicitações com status Enviado (SENT) podem ser marcadas como pagas",
        );
      });

      it("should display an error alert (role='alert') when onMarkAsPaid rejects with an error", async () => {
        const sentReq = markPaidMockRequests[4];
        const onMarkAsPaidMock = vi
          .fn()
          .mockRejectedValueOnce(new Error("Erro ao marcar solicitação"));

        render(
          <RequestsTable
            requests={[sentReq]}
            onMarkAsPaid={onMarkAsPaidMock}
          />,
        );

        fireEvent.click(
          screen.getByRole("button", {
            name: /abrir menu de ações para Felipe Enviado/i,
          }),
        );

        const markPaidItem = screen.getByRole("menuitem", {
          name: /marcar como pago/i,
        });

        await act(async () => {
          fireEvent.click(markPaidItem);
        });

        const alert = await screen.findByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent("Erro ao marcar solicitação");
      });
    });

    describe("Batch Action (Top Bar - 'Marcar como Pago em Lote')", () => {
      it("should render 'Marcar como Pago em Lote' button disabled initially when 0 selecionado(s)", () => {
        render(<RequestsTable requests={markPaidMockRequests} />);

        const batchPayButton = screen.getByRole("button", {
          name: /marcar como pago em lote/i,
        });
        expect(batchPayButton).toBeInTheDocument();
        expect(batchPayButton).toBeDisabled();
      });

      it("should keep 'Marcar como Pago em Lote' disabled when only non-SENT rows (PENDING, PROCESSING, APPROVED, DENIED, PAID) are selected", () => {
        render(<RequestsTable requests={markPaidMockRequests} />);

        fireEvent.click(
          screen.getByRole("checkbox", { name: /Alice Pendente/i }),
        );
        fireEvent.click(
          screen.getByRole("checkbox", { name: /Diego Processando/i }),
        );
        fireEvent.click(
          screen.getByRole("checkbox", { name: /Bruno Aprovado/i }),
        );
        fireEvent.click(
          screen.getByRole("checkbox", { name: /Eduarda Negada/i }),
        );
        fireEvent.click(
          screen.getByRole("checkbox", { name: /Gabriela Paga/i }),
        );

        expect(screen.getByText(/5 selecionado\(s\)/i)).toBeInTheDocument();

        const batchPayButton = screen.getByRole("button", {
          name: /marcar como pago em lote/i,
        });
        expect(batchPayButton).toBeDisabled();
      });

      it("should enable 'Marcar como Pago em Lote' when 1 or more SENT requests are selected", () => {
        render(<RequestsTable requests={markPaidMockRequests} />);

        const batchPayButton = screen.getByRole("button", {
          name: /marcar como pago em lote/i,
        });
        expect(batchPayButton).toBeDisabled();

        fireEvent.click(
          screen.getByRole("checkbox", { name: /Felipe Enviado/i }),
        );

        expect(batchPayButton).not.toBeDisabled();
      });

      it("should call markBatchRefundsAsPaidAction directly (without modal) sending ONLY selected SENT IDs and clear only processed SENT IDs from selection", async () => {
        const sent1 = markPaidMockRequests[4];
        const sent2 = markPaidMockRequests[5];
        vi.mocked(markBatchRefundsAsPaidAction).mockResolvedValueOnce({
          success: true,
          data: {
            succeeded: [
              { ...sent1, status: "PAID" },
              { ...sent2, status: "PAID" },
            ],
            failed: [],
          },
        });

        render(<RequestsTable requests={markPaidMockRequests} />);

        const pendingCb = screen.getByRole("checkbox", {
          name: /Alice Pendente/i,
        });
        const approvedCb = screen.getByRole("checkbox", {
          name: /Bruno Aprovado/i,
        });
        const sent1Cb = screen.getByRole("checkbox", {
          name: /Felipe Enviado/i,
        });
        const sent2Cb = screen.getByRole("checkbox", {
          name: /Helena Enviada/i,
        });

        fireEvent.click(pendingCb);
        fireEvent.click(approvedCb);
        fireEvent.click(sent1Cb);
        fireEvent.click(sent2Cb);
        expect(screen.getByText(/4 selecionado\(s\)/i)).toBeInTheDocument();

        const batchPayButton = screen.getByRole("button", {
          name: /marcar como pago em lote/i,
        });

        await act(async () => {
          fireEvent.click(batchPayButton);
        });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(markBatchRefundsAsPaidAction).toHaveBeenCalledTimes(1);
        expect(markBatchRefundsAsPaidAction).toHaveBeenCalledWith([
          "req-sent-1",
          "req-sent-2",
        ]);
        expect(sent1Cb).not.toBeChecked();
        expect(sent2Cb).not.toBeChecked();
        expect(pendingCb).toBeChecked();
        expect(approvedCb).toBeChecked();
        expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();
      });

      it("should call onMarkBatchAsPaid directly (without modal or calling markBatchRefundsAsPaidAction) sending ONLY selected SENT IDs and clear processed SENT IDs when onMarkBatchAsPaid prop is provided", async () => {
        const onMarkBatchAsPaidMock = vi.fn().mockResolvedValue(undefined);

        render(
          <RequestsTable
            requests={markPaidMockRequests}
            onMarkBatchAsPaid={onMarkBatchAsPaidMock}
          />,
        );

        const approvedCb = screen.getByRole("checkbox", {
          name: /Bruno Aprovado/i,
        });
        const sent1Cb = screen.getByRole("checkbox", {
          name: /Felipe Enviado/i,
        });

        fireEvent.click(approvedCb);
        fireEvent.click(sent1Cb);
        expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();

        const batchPayButton = screen.getByRole("button", {
          name: /marcar como pago em lote/i,
        });

        await act(async () => {
          fireEvent.click(batchPayButton);
        });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(onMarkBatchAsPaidMock).toHaveBeenCalledTimes(1);
        expect(onMarkBatchAsPaidMock).toHaveBeenCalledWith(["req-sent-1"]);
        expect(markBatchRefundsAsPaidAction).not.toHaveBeenCalled();
        expect(sent1Cb).not.toBeChecked();
        expect(approvedCb).toBeChecked();
        expect(screen.getByText(/1 selecionado\(s\)/i)).toBeInTheDocument();
      });

      it("should show loading state (disable button and render spinner) while markBatchRefundsAsPaidAction is pending", async () => {
        const sent1 = markPaidMockRequests[4];
        let resolvePromise!: (value: {
          success: boolean;
          data?: {
            succeeded: RefundRequest[];
            failed: Array<{ id: string; error: string }>;
          };
          error?: string;
        }) => void;
        const pendingPromise = new Promise<{
          success: boolean;
          data?: {
            succeeded: RefundRequest[];
            failed: Array<{ id: string; error: string }>;
          };
          error?: string;
        }>((resolve) => {
          resolvePromise = resolve;
        });

        vi.mocked(markBatchRefundsAsPaidAction).mockReturnValueOnce(
          pendingPromise,
        );

        render(<RequestsTable requests={markPaidMockRequests} />);

        fireEvent.click(
          screen.getByRole("checkbox", { name: /Felipe Enviado/i }),
        );

        const batchPayButton = screen.getByRole("button", {
          name: /marcar como pago em lote/i,
        });
        fireEvent.click(batchPayButton);

        expect(batchPayButton).toBeDisabled();
        expect(
          batchPayButton.querySelector(".animate-spin"),
        ).toBeInTheDocument();

        await act(async () => {
          resolvePromise({
            success: true,
            data: {
              succeeded: [{ ...sent1, status: "PAID" }],
              failed: [],
            },
          });
        });

        expect(
          batchPayButton.querySelector(".animate-spin"),
        ).not.toBeInTheDocument();
      });

      it("should display error alert (role='alert') and remove only succeeded SENT IDs from selection when markBatchRefundsAsPaidAction returns partial failure", async () => {
        const sent1 = markPaidMockRequests[4];
        vi.mocked(markBatchRefundsAsPaidAction).mockResolvedValueOnce({
          success: false,
          data: {
            succeeded: [{ ...sent1, status: "PAID" }],
            failed: [
              { id: "req-sent-2", error: "Erro ao atualizar req-sent-2" },
            ],
          },
          error:
            "Falha ao marcar 1 solicitação(ões) como paga(s): Erro ao atualizar req-sent-2",
        });

        render(<RequestsTable requests={markPaidMockRequests} />);

        const approvedCb = screen.getByRole("checkbox", {
          name: /Bruno Aprovado/i,
        });
        const sent1Cb = screen.getByRole("checkbox", {
          name: /Felipe Enviado/i,
        });
        const sent2Cb = screen.getByRole("checkbox", {
          name: /Helena Enviada/i,
        });

        fireEvent.click(approvedCb);
        fireEvent.click(sent1Cb);
        fireEvent.click(sent2Cb);
        expect(screen.getByText(/3 selecionado\(s\)/i)).toBeInTheDocument();

        await act(async () => {
          fireEvent.click(
            screen.getByRole("button", { name: /marcar como pago em lote/i }),
          );
        });

        const alert = await screen.findByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent("Erro ao atualizar req-sent-2");
        expect(sent1Cb).not.toBeChecked();
        expect(sent2Cb).toBeChecked();
        expect(approvedCb).toBeChecked();
        expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();
      });

      it("should display error alert (role='alert') and keep all selected IDs when markBatchRefundsAsPaidAction returns an error without data", async () => {
        vi.mocked(markBatchRefundsAsPaidAction).mockResolvedValueOnce({
          success: false,
          error: "Erro inesperado ao marcar solicitações como pagas",
        });

        render(<RequestsTable requests={markPaidMockRequests} />);

        const sent1Cb = screen.getByRole("checkbox", {
          name: /Felipe Enviado/i,
        });
        const sent2Cb = screen.getByRole("checkbox", {
          name: /Helena Enviada/i,
        });

        fireEvent.click(sent1Cb);
        fireEvent.click(sent2Cb);

        await act(async () => {
          fireEvent.click(
            screen.getByRole("button", { name: /marcar como pago em lote/i }),
          );
        });

        const alert = await screen.findByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(
          "Erro inesperado ao marcar solicitações como pagas",
        );
        expect(sent1Cb).toBeChecked();
        expect(sent2Cb).toBeChecked();
        expect(screen.getByText(/2 selecionado\(s\)/i)).toBeInTheDocument();
      });

      it("should display error alert (role='alert') and keep all selected IDs when markBatchRefundsAsPaidAction rejects with an exception", async () => {
        vi.mocked(markBatchRefundsAsPaidAction).mockRejectedValueOnce(
          new Error("Falha de comunicação com o servidor"),
        );

        render(<RequestsTable requests={markPaidMockRequests} />);

        const sent1Cb = screen.getByRole("checkbox", {
          name: /Felipe Enviado/i,
        });
        fireEvent.click(sent1Cb);

        await act(async () => {
          fireEvent.click(
            screen.getByRole("button", { name: /marcar como pago em lote/i }),
          );
        });

        const alert = await screen.findByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent("Falha de comunicação com o servidor");
        expect(sent1Cb).toBeChecked();
        expect(screen.getByText(/1 selecionado\(s\)/i)).toBeInTheDocument();
      });
    });
  });
});
