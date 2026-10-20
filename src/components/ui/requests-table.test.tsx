import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processReceiptAction } from "@/actions/ai.actions";
import type { Database } from "@/models/database.types";
import { RequestsTable } from "./requests-table";

vi.mock("@/actions/ai.actions", () => ({
  processReceiptAction: vi.fn(),
}));

type RefundRequest = Database["public"]["Tables"]["refund_requests"]["Row"];

describe("RequestsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(processReceiptAction).mockResolvedValue({ success: true });
  });

  it("should render table headers correctly", () => {
    render(<RequestsTable requests={[]} />);
    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Anexo")).toBeInTheDocument();
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

  describe("Anexo Column and ReceiptModal Integration", () => {
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

    it("should render a 'Ver Anexo' button only when receipt_file_url is present", () => {
      render(<RequestsTable requests={mockRequests} />);

      const buttons = screen.getAllByRole("button", { name: /ver anexo/i });
      expect(buttons).toHaveLength(1);
    });

    it("should open ReceiptModal with the correct URL when the 'Ver Anexo' button is clicked", () => {
      render(<RequestsTable requests={mockRequests} />);

      const button = screen.getByRole("button", { name: /ver anexo/i });

      // Modal should not be present initially (or at least hidden, but ReceiptModal returns null if !isOpen)
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.click(button);

      // Modal should now be in the document
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // Check if iframe is rendered with correct src for PDF
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

    it("should render 'Aprovar para Leitura' button only for requests with PENDING status", () => {
      render(<RequestsTable requests={mockDetailedRequests} />);

      const approveButtons = screen.getAllByRole("button", {
        name: /aprovar para leitura/i,
      });

      // Only req-1 has status PENDING, while others are APPROVED, PROCESSING, DENIED, SENT, PAID
      expect(approveButtons).toHaveLength(1);
    });

    it("should trigger onProcessRequest callback with request id when 'Aprovar para Leitura' is clicked", () => {
      const onProcessRequestMock = vi.fn();

      render(
        <RequestsTable
          requests={mockDetailedRequests}
          onProcessRequest={onProcessRequestMock}
        />,
      );

      const approveButton = screen.getByRole("button", {
        name: /aprovar para leitura/i,
      });
      fireEvent.click(approveButton);

      expect(onProcessRequestMock).toHaveBeenCalledTimes(1);
      expect(onProcessRequestMock).toHaveBeenCalledWith("req-1");
    });

    it("should call default processReceiptAction with request id when 'Aprovar para Leitura' is clicked and onProcessRequest is not provided", () => {
      render(<RequestsTable requests={mockDetailedRequests} />);

      const approveButton = screen.getByRole("button", {
        name: /aprovar para leitura/i,
      });
      fireEvent.click(approveButton);

      expect(processReceiptAction).toHaveBeenCalledTimes(1);
      expect(processReceiptAction).toHaveBeenCalledWith("req-1");
    });

    it("should display an error alert when processReceiptAction returns { success: false, error }", async () => {
      vi.mocked(processReceiptAction).mockResolvedValueOnce({
        success: false,
        error: "Falha ao processar nota fiscal",
      });

      render(<RequestsTable requests={mockDetailedRequests} />);

      const approveButton = screen.getByRole("button", {
        name: /aprovar para leitura/i,
      });
      fireEvent.click(approveButton);

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
});
