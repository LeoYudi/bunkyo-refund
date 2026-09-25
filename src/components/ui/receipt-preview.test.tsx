import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ReceiptPreview } from "./receipt-preview";

describe("ReceiptPreview Component", () => {
  beforeAll(() => {
    URL.createObjectURL = vi.fn(() => "mock-url");
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders an <img> tag with alt="Preview do comprovante" when file is an image', () => {
    const imageFile = new File(["dummy content"], "test.png", {
      type: "image/png",
    });
    render(<ReceiptPreview file={imageFile} />);
    const img = screen.queryByAltText("Preview do comprovante");
    expect(img).not.toBeNull();
    expect(img?.tagName.toLowerCase()).toBe("img");
    expect(img?.getAttribute("src")).toBe("mock-url");
    expect(URL.createObjectURL).toHaveBeenCalledWith(imageFile);
  });

  it("does not render an <img> tag when file is a PDF, but renders the generic document icon", () => {
    const pdfFile = new File(["dummy content"], "test.pdf", {
      type: "application/pdf",
    });
    const { container } = render(<ReceiptPreview file={pdfFile} />);
    const img = screen.queryByAltText("Preview do comprovante");
    expect(img).toBeNull();

    const fileIcon = container.querySelector(".lucide-file-text");
    expect(fileIcon).not.toBeNull();
  });

  it("renders the file name and triggers cancel/confirm events", () => {
    const imageFile = new File(["dummy content"], "my-receipt.png", {
      type: "image/png",
    });
    const onConfirmMock = vi.fn();
    const onCancelMock = vi.fn();

    render(
      <ReceiptPreview
        file={imageFile}
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
      />,
    );

    expect(screen.queryByText("my-receipt.png")).not.toBeNull();

    const confirmButton = screen.getByText(/confirmar/i);
    const cancelButton = screen.getByText(/cancelar/i);

    fireEvent.click(confirmButton);
    expect(onConfirmMock).toHaveBeenCalledOnce();

    fireEvent.click(cancelButton);
    expect(onCancelMock).toHaveBeenCalledOnce();
  });
});
