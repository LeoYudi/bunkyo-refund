import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BatchPaymentDialog } from "./batch-payment-dialog";

describe("BatchPaymentDialog", () => {
  it("renders when isOpen is true", () => {
    render(<BatchPaymentDialog isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Enviar Pagamentos em Lote")).toBeDefined();
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(<BatchPaymentDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
  });
});
