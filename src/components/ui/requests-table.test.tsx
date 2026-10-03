import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
        receipt_file_url: null,
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
        receipt_file_url: null,
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
});
