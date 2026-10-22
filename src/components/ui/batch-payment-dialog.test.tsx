import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RefundRequest } from "@/models/refund.model";
import { BatchPaymentDialog } from "./batch-payment-dialog";

const mockSelectedRequests: RefundRequest[] = [
  {
    id: "req-1",
    requester_name: "Alice Silva",
    status: "APPROVED",
    created_at: new Date("2026-09-25T10:00:00Z").toISOString(),
    updated_at: new Date("2026-09-25T10:00:00Z").toISOString(),
    description: "Almoço da equipe",
    issue_date: "2026-09-25",
    issue_number: "NF-100",
    issuer_cnpj: "12.345.678/0001-90",
    issuer_name: "Restaurante Sabor",
    receipt_file_url: "https://example.com/receipt1.pdf",
    receiver_cnpj: null,
    reviewed_by: "admin-1",
    total_value: 150.5,
  },
  {
    id: "req-2",
    requester_name: "Bob Santos",
    status: "APPROVED",
    created_at: new Date("2026-09-26T10:00:00Z").toISOString(),
    updated_at: new Date("2026-09-26T10:00:00Z").toISOString(),
    description: "Transporte evento",
    issue_date: "2026-09-26",
    issue_number: "NF-101",
    issuer_cnpj: "98.765.432/0001-10",
    issuer_name: "Fretamento Express",
    receipt_file_url: "https://example.com/receipt2.pdf",
    receiver_cnpj: null,
    reviewed_by: "admin-1",
    total_value: 450.0,
  },
];

describe("BatchPaymentDialog", () => {
  it("should render using Shadcn Dialog (role='dialog') when isOpen is true and not render when isOpen is false", () => {
    const { rerender } = render(
      <BatchPaymentDialog
        isOpen={false}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Enviar Pagamentos em Lote")).toBeInTheDocument();
  });

  it("should display selected requests count, individual requester names with BRL amounts, and consolidated total value in BRL", () => {
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
      />,
    );

    expect(
      screen.getByText(/2 solicitaç(ões|oes) selecionadas/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Alice Silva")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*150,50/)).toBeInTheDocument();
    expect(screen.getByText("Bob Santos")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*450,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*600,50/)).toBeInTheDocument();
  });

  it("should display singular count text when 1 request is selected", () => {
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={[mockSelectedRequests[0]]}
      />,
    );

    expect(
      screen.getByText(/1 solicitaç(ão|ao) selecionada/i),
    ).toBeInTheDocument();
  });

  it("should call onClose when 'Cancelar' button is clicked", () => {
    const onClose = vi.fn();
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={onClose}
        selectedRequests={mockSelectedRequests}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onConfirm with selectedRequests and empty recipientEmail, cc, and bcc when 'Confirmar Envio' button is clicked without filling emails", () => {
    const onConfirm = vi.fn();
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
        onConfirm={onConfirm}
      />,
    );

    const emailInput = screen.getByPlaceholderText(
      /e-mail|destinatário|financeiro/i,
    );
    expect(emailInput).toBeInTheDocument();
    expect(screen.getByLabelText(/Cc \(Cópia\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cco \(Cópia Oculta\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirmar envio/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(mockSelectedRequests, "", "", "");
  });

  it("should render recipient email, Cc, and Cco inputs and pass the typed values to onConfirm when 'Confirmar Envio' is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
        onConfirm={onConfirm}
      />,
    );

    const emailInput = screen.getByPlaceholderText(
      /e-mail|destinatário|financeiro/i,
    );
    const ccInput = screen.getByLabelText(/Cc \(Cópia\)/i);
    const bccInput = screen.getByLabelText(/Cco \(Cópia Oculta\)/i);

    fireEvent.change(emailInput, {
      target: { value: "financeiro@bunkyo.org.br" },
    });
    fireEvent.change(ccInput, {
      target: { value: "gestor@bunkyo.org.br, fiscal@bunkyo.org.br" },
    });
    fireEvent.change(bccInput, {
      target: { value: "diretoria@bunkyo.org.br" },
    });

    fireEvent.click(screen.getByRole("button", { name: /confirmar envio/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(
      mockSelectedRequests,
      "financeiro@bunkyo.org.br",
      "gestor@bunkyo.org.br, fiscal@bunkyo.org.br",
      "diretoria@bunkyo.org.br",
    );
  });
});
