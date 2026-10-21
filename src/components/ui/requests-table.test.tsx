import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  processBatchReceiptsAction,
  processReceiptAction,
} from "@/actions/ai.actions";
import type { Database } from "@/models/database.types";
import { RequestsTable } from "./requests-table";

vi.mock("@/actions/ai.actions", () => ({
  processReceiptAction: vi.fn(),
  processBatchReceiptsAction: vi.fn(),
}));

type RefundRequest = Database["public"]["Tables"]["refund_requests"]["Row"];

describe("RequestsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(processReceiptAction).mockResolvedValue({ success: true });
    vi.mocked(processBatchReceiptsAction).mockResolvedValue({
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

    it("should trigger onProcessRequest callback with request id when 'Aprovar para Leitura' menuitem is clicked", () => {
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
      fireEvent.click(approveItem);

      expect(onProcessRequestMock).toHaveBeenCalledTimes(1);
      expect(onProcessRequestMock).toHaveBeenCalledWith("req-1");
    });

    it("should call default processReceiptAction with request id when 'Aprovar para Leitura' menuitem is clicked and onProcessRequest is not provided", () => {
      render(<RequestsTable requests={mockDetailedRequests} />);

      const actionButtons = screen.getAllByRole("button", {
        name: /abrir menu|ações/i,
      });
      fireEvent.click(actionButtons[0]);

      const approveItem = screen.getByRole("menuitem", {
        name: /aprovar para leitura/i,
      });
      fireEvent.click(approveItem);

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

    it("should enable checkboxes for PENDING and APPROVED rows and disable them for PROCESSING, DENIED, SENT, and PAID rows", () => {
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
      expect(processingCb).toBeDisabled();
      expect(deniedCb).toBeDisabled();
      expect(sentCb).toBeDisabled();
      expect(paidCb).toBeDisabled();
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

    it("should call processBatchReceiptsAction with only selected PENDING request IDs when both PENDING and APPROVED rows are selected and 'Aprovar para Leitura em Lote' is clicked", () => {
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
      fireEvent.click(batchApproveButton);

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
  });
});
