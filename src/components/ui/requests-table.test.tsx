import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/models/database.types";
import { RequestsTable } from "./requests-table";

type RefundRequest = Database["public"]["Tables"]["refund_requests"]["Row"];

describe("RequestsTable", () => {
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
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("APPROVED")).toBeInTheDocument();
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
    ];

    it("should render new Phase 4 column headers: Emissor, CNPJ, Valor Total, and Ações", () => {
      render(<RequestsTable requests={[]} />);

      expect(screen.getByText("Emissor")).toBeInTheDocument();
      expect(screen.getByText("CNPJ")).toBeInTheDocument();
      expect(screen.getByText("Valor Total")).toBeInTheDocument();
      expect(screen.getByText("Ações")).toBeInTheDocument();
    });

    it("should display extracted data (issuer_name, issuer_cnpj, total_value in BRL currency) and '-' for null values", () => {
      render(<RequestsTable requests={mockDetailedRequests} />);

      // Populated fields in req-1
      expect(screen.getByText("Restaurante Sabor")).toBeInTheDocument();
      expect(screen.getByText("12.345.678/0001-90")).toBeInTheDocument();
      expect(screen.getByText(/R\$\s*150,50/)).toBeInTheDocument();

      // Null fields in req-2 and req-3 should display "-"
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });

    it("should render 'Aprovar para Leitura' button only for requests with PENDING status", () => {
      render(<RequestsTable requests={mockDetailedRequests} />);

      const approveButtons = screen.getAllByRole("button", {
        name: /aprovar para leitura/i,
      });

      // Only req-1 has status PENDING, while req-2 is APPROVED and req-3 is PROCESSING
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
  });
});
