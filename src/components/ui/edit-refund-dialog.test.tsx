import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RefundRequest } from "@/models/refund.model";
import { EditRefundDialog } from "./edit-refund-dialog";

const mockRequest: RefundRequest = {
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

describe("EditRefundDialog", () => {
  it("should not render dialog when isOpen is false", () => {
    render(
      <EditRefundDialog
        isOpen={false}
        onClose={vi.fn()}
        request={mockRequest}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render dialog with title 'Editar Solicitação' when isOpen is true", () => {
    render(
      <EditRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequest}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/editar solicita/i)).toBeInTheDocument();
  });

  it("should prefill inputs with request data", () => {
    render(
      <EditRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequest}
      />,
    );

    expect(screen.getByDisplayValue("Carlos Silva")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Papelaria Central")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12.345.678/0001-90")).toBeInTheDocument();
    expect(screen.getByDisplayValue("98.765.432/0001-10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-10-15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("NF-9988")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Material de escritório"),
    ).toBeInTheDocument();
    // total_value can be formatted as 150.5 or 150,5
    expect(screen.getByDisplayValue(/150[.,]5/)).toBeInTheDocument();
    expect(screen.getByText("15/10/2026")).toBeInTheDocument();
  });

  it("should allow user to type new values into fields", () => {
    render(
      <EditRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequest}
      />,
    );

    const nameInput = screen.getByDisplayValue("Carlos Silva");
    fireEvent.change(nameInput, { target: { value: "Carlos Eduardo" } });
    expect(nameInput).toHaveValue("Carlos Eduardo");

    const descInput = screen.getByDisplayValue("Material de escritório");
    fireEvent.change(descInput, { target: { value: "Novo material" } });
    expect(descInput).toHaveValue("Novo material");
  });

  it("should call onConfirm callback when clicking 'Salvar' button", () => {
    const onConfirm = vi.fn();
    render(
      <EditRefundDialog
        isOpen={true}
        onClose={vi.fn()}
        request={mockRequest}
        onConfirm={onConfirm}
      />,
    );

    const saveButton = screen.getByRole("button", { name: /salvar/i });
    fireEvent.click(saveButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  it("should call onClose when clicking 'Cancelar' button", () => {
    const onClose = vi.fn();
    render(
      <EditRefundDialog
        isOpen={true}
        onClose={onClose}
        request={mockRequest}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
