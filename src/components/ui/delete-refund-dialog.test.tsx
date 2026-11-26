import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RefundRequest } from "@/models/refund.model";
import { DeleteRefundDialog } from "./delete-refund-dialog";

const mockRequestPending: RefundRequest = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  requester_name: "Carlos Silva",
  status: "PENDING",
  total_value: 150.5,
  issuer_name: "Papelaria Central",
  issuer_cnpj: "12.345.678/0001-90",
  receiver_cnpj: "98.765.432/0001-10",
  issue_date: "2026-10-15",
  issue_number: "NF-9988",
  description: "Material de escritório",
  receipt_file_url: "https://example.com/receipt.pdf",
  created_at: new Date("2026-10-15T10:00:00Z").toISOString(),
  updated_at: new Date("2026-10-15T10:00:00Z").toISOString(),
  reviewed_by: null,
};

const mockRequestSent: RefundRequest = {
  ...mockRequestPending,
  id: "sent-req-1",
  status: "SENT",
};

const mockRequestPaid: RefundRequest = {
  ...mockRequestPending,
  id: "paid-req-1",
  status: "PAID",
};

describe("DeleteRefundDialog", () => {
  it("should not render dialog when isOpen is false", () => {
    render(
      <DeleteRefundDialog
        isOpen={false}
        onClose={vi.fn()}
        request={mockRequestPending}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render dialog with title 'Excluir Solicitação' and irreversible action warning when isOpen is true", () => {
    render(
      <DeleteRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequestPending}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/excluir solicita/i)).toBeInTheDocument();
    expect(
      screen.getByText(/irreversível|permanente|não pode ser desfeita/i),
    ).toBeInTheDocument();
  });

  it("should display request info including requester name and formatted value", () => {
    render(
      <DeleteRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequestPending}
      />,
    );

    expect(screen.getByText(/Carlos Silva/)).toBeInTheDocument();
    expect(screen.getByText(/150[.,]50/)).toBeInTheDocument();
  });

  it("should display an additional warning alert when request status is SENT", () => {
    render(
      <DeleteRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequestSent}
      />,
    );

    expect(screen.getByText(/atenção|enviad|financeiro/i)).toBeInTheDocument();
  });

  it("should display an additional warning alert when request status is PAID", () => {
    render(
      <DeleteRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequestPaid}
      />,
    );

    expect(screen.getByText(/atenção|pago|concluído/i)).toBeInTheDocument();
  });

  it("should not display the SENT/PAID special alert when status is PENDING", () => {
    render(
      <DeleteRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequestPending}
      />,
    );

    expect(
      screen.queryByText(/já foi enviado|já foi pago/i),
    ).not.toBeInTheDocument();
  });

  it("should call onConfirm callback when destructive delete button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <DeleteRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequestPending}
        onConfirm={onConfirm}
      />,
    );

    const deleteButton = screen.getByRole("button", {
      name: /excluir|confirmar/i,
    });
    fireEvent.click(deleteButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  it("should call onClose when clicking 'Cancelar' button", () => {
    const onClose = vi.fn();
    render(
      <DeleteRefundDialog
        isOpen={true}
        onClose={onClose}
        request={mockRequestPending}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
