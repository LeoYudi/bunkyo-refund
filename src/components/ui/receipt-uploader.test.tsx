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

  it("displays the maximum file size limit (5MB) in the dropzone subtitle", () => {
    render(<ReceiptUploader />);
    const sizeLimitText = screen.queryByText(/5\s*MB/i);
    expect(sizeLimitText).not.toBeNull();
  });

  it("simulates opening the file dialog when the dropzone is clicked", () => {
    const { container } = render(<ReceiptUploader />);
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    if (fileInput) {
      const clickSpy = vi.spyOn(fileInput, "click");
      const dropzone = container.querySelector(".border-dashed");
      if (dropzone) {
        fireEvent.click(dropzone);
      }
      expect(clickSpy).toHaveBeenCalled();
    }
  });

  describe("Camera capture", () => {
    it('renders a "Tirar Foto" button', () => {
      render(<ReceiptUploader />);
      const button = screen.queryByText(/tirar foto/i);
      expect(button).not.toBeNull();
    });

    it('has an input with capture="environment" and accept="image/*"', () => {
      const { container } = render(<ReceiptUploader />);
      const cameraInput = container.querySelector(
        'input[type="file"][capture="environment"]',
      ) as HTMLInputElement;
      expect(cameraInput).not.toBeNull();
      if (cameraInput) {
        expect(cameraInput.accept).toContain("image/*");
      }
    });

    it('simulates opening the camera file dialog when "Tirar Foto" is clicked', () => {
      const { container } = render(<ReceiptUploader />);
      const button = screen.queryByText(/tirar foto/i);
      expect(button).not.toBeNull();

      const cameraInput = container.querySelector(
        'input[type="file"][capture="environment"]',
      ) as HTMLInputElement;
      expect(cameraInput).not.toBeNull();

      if (button && cameraInput) {
        const clickSpy = vi.spyOn(cameraInput, "click");
        fireEvent.click(button);
        expect(clickSpy).toHaveBeenCalled();
      }
    });
  });

  describe("File size limit validation (5MB)", () => {
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;

    it("shows an error message and does not call onFileSelect when a file larger than 5MB is selected via input", () => {
      const onFileSelect = vi.fn();
      const { container } = render(
        <ReceiptUploader onFileSelect={onFileSelect} />,
      );
      const fileInput = container.querySelector(
        'input[type="file"]:not([capture])',
      ) as HTMLInputElement;
      expect(fileInput).not.toBeNull();

      const oversizedFile = new File(["content"], "large-receipt.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(oversizedFile, "size", {
        value: MAX_SIZE_BYTES + 1024,
      });

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

      expect(onFileSelect).not.toHaveBeenCalled();
      expect(screen.queryByText(/5\s*MB/i)).not.toBeNull();
      expect(
        screen.queryByRole("alert") ??
          screen.queryByText(/muito grande|excede|máximo.*5\s*MB/i),
      ).not.toBeNull();
    });

    it("shows an error message and does not call onFileSelect when a file larger than 5MB is dropped", () => {
      const onFileSelect = vi.fn();
      const { container } = render(
        <ReceiptUploader onFileSelect={onFileSelect} />,
      );
      const dropzone = container.querySelector(".border-dashed");
      expect(dropzone).not.toBeNull();

      const oversizedFile = new File(["content"], "large-receipt.png", {
        type: "image/png",
      });
      Object.defineProperty(oversizedFile, "size", {
        value: MAX_SIZE_BYTES + 1024,
      });

      if (dropzone) {
        fireEvent.drop(dropzone, {
          dataTransfer: { files: [oversizedFile] },
        });
      }

      expect(onFileSelect).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("alert") ??
          screen.queryByText(/muito grande|excede|máximo.*5\s*MB/i),
      ).not.toBeNull();
    });

    it("clears the error message and calls onFileSelect when a valid file (<= 5MB) is selected after an oversized file", () => {
      const onFileSelect = vi.fn();
      const { container } = render(
        <ReceiptUploader onFileSelect={onFileSelect} />,
      );
      const fileInput = container.querySelector(
        'input[type="file"]:not([capture])',
      ) as HTMLInputElement;
      expect(fileInput).not.toBeNull();

      const oversizedFile = new File(["content"], "large-receipt.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(oversizedFile, "size", {
        value: MAX_SIZE_BYTES + 1024,
      });

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
      expect(onFileSelect).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("alert") ??
          screen.queryByText(/muito grande|excede|máximo.*5\s*MB/i),
      ).not.toBeNull();

      const validFile = new File(["valid content"], "valid-receipt.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(validFile, "size", {
        value: MAX_SIZE_BYTES,
      });

      fireEvent.change(fileInput, { target: { files: [validFile] } });
      expect(onFileSelect).toHaveBeenCalledWith(validFile);
      expect(screen.queryByRole("alert")).toBeNull();
      expect(
        screen.queryByText(/muito grande|excede|máximo permitido/i),
      ).toBeNull();
    });
  });
});
