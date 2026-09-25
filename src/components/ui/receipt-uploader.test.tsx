import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReceiptUploader } from "./receipt-uploader";

describe("ReceiptUploader Base Component", () => {
  it('renders an input with type="file"', () => {
    const { container } = render(<ReceiptUploader />);
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
  });

  it("accepts image/* and application/pdf", () => {
    const { container } = render(<ReceiptUploader />);
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    if (fileInput) {
      expect(fileInput.accept).toContain("image/*");
      expect(fileInput.accept).toContain("application/pdf");
    }
  });

  it("renders dropzone text", () => {
    render(<ReceiptUploader />);
    const textElement = screen.queryByText(/arraste e solte/i);
    expect(textElement).not.toBeNull();
  });

  it("simulates opening the file dialog when the dropzone is clicked", () => {
    const { container } = render(<ReceiptUploader />);
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    if (fileInput) {
      const clickSpy = vi.spyOn(fileInput, "click");
      const dropzone = container.firstElementChild;
      if (dropzone) {
        fireEvent.click(dropzone);
      }
      expect(clickSpy).toHaveBeenCalled();
    }
  });
});
