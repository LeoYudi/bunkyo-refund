import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
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

  describe("Image Preview", () => {
    beforeAll(() => {
      URL.createObjectURL = vi.fn(() => "mock-url");
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('renders an <img> tag with alt="Preview do comprovante" when selectedFile is an image', () => {
      const imageFile = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      render(<ReceiptUploader selectedFile={imageFile} />);
      const img = screen.queryByAltText("Preview do comprovante");
      expect(img).not.toBeNull();
      expect(img?.tagName.toLowerCase()).toBe("img");
      expect(img?.getAttribute("src")).toBe("mock-url");
      expect(URL.createObjectURL).toHaveBeenCalledWith(imageFile);
    });

    it("does not render an <img> tag when selectedFile is a PDF, but renders the generic document icon", () => {
      const pdfFile = new File(["dummy content"], "test.pdf", {
        type: "application/pdf",
      });
      const { container } = render(<ReceiptUploader selectedFile={pdfFile} />);
      const img = screen.queryByAltText("Preview do comprovante");
      expect(img).toBeNull();

      const fileIcon = container.querySelector(".lucide-file-text");
      expect(fileIcon).not.toBeNull();
    });
  });
});
