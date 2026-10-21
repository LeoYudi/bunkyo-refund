import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RefundRequest } from "@/models/refund.model";
import { RefundBatchEmail } from "./refund-batch-email";

const mockRequests: RefundRequest[] = [
  {
    id: "req-1",
    requester_name: "Alice Silva",
    status: "APPROVED",
    created_at: "2026-10-20T10:00:00Z",
    updated_at: "2026-10-20T10:00:00Z",
    description: "Almoço de equipe",
    issue_date: "2026-10-20",
    issue_number: "NF-101",
    issuer_cnpj: "12.345.678/0001-90",
    issuer_name: "Restaurante Sabor",
    receipt_file_url: "https://example.com/receipts/doc1.pdf",
    receiver_cnpj: "98.765.432/0001-10",
    reviewed_by: "admin-1",
    total_value: 150.5,
  },
  {
    id: "req-2",
    requester_name: "Bob Santos",
    status: "APPROVED",
    created_at: "2026-10-21T10:00:00Z",
    updated_at: "2026-10-21T10:00:00Z",
    description: "Táxi evento",
    issue_date: "2026-10-21",
    issue_number: null,
    issuer_cnpj: null,
    issuer_name: "Táxi SP",
    receipt_file_url: "https://example.com/receipts/doc2.png",
    receiver_cnpj: null,
    reviewed_by: "admin-1",
    total_value: 249.5,
  },
];

describe("RefundBatchEmail", () => {
  it("should render the email title with the provided date", () => {
    render(<RefundBatchEmail date="21/10/2026" requests={mockRequests} />);

    expect(
      screen.getByText(/Pedido de Reembolsos - 21\/10\/2026/i),
    ).toBeInTheDocument();
  });

  it("should render table headers: Colaborador, Valor, CNPJ, and Link do Comprovante", () => {
    render(<RefundBatchEmail date="21/10/2026" requests={mockRequests} />);

    expect(screen.getByText("Colaborador")).toBeInTheDocument();
    expect(screen.getByText("Valor")).toBeInTheDocument();
    expect(screen.getByText("CNPJ")).toBeInTheDocument();
    expect(screen.getByText("Link do Comprovante")).toBeInTheDocument();
  });

  it("should render each request with requester_name, BRL formatted total_value, issuer_cnpj (or '-'), and receipt_file_url link", () => {
    render(<RefundBatchEmail date="21/10/2026" requests={mockRequests} />);

    expect(screen.getByText("Alice Silva")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*150,50/)).toBeInTheDocument();
    expect(screen.getByText("12.345.678/0001-90")).toBeInTheDocument();

    expect(screen.getByText("Bob Santos")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*249,50/)).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("https://example.com/receipts/doc1.pdf");
    expect(hrefs).toContain("https://example.com/receipts/doc2.png");
  });

  it("should render the footer with Valor Total Geral consolidated in BRL", () => {
    render(<RefundBatchEmail date="21/10/2026" requests={mockRequests} />);

    expect(screen.getByText(/Valor Total Geral/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*400,00/)).toBeInTheDocument();
  });
});
