import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReceiptModal } from "./receipt-modal";

describe("ReceiptModal", () => {
  const dummyUrl = "https://example.com/test-receipt.pdf";

  it("does not render when closed", () => {
    const { container } = render(
      <ReceiptModal isOpen={false} onClose={vi.fn()} receiptUrl={dummyUrl} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the modal when open", () => {
    render(
      <ReceiptModal isOpen={true} onClose={vi.fn()} receiptUrl={dummyUrl} />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the receipt media (img or iframe) when a url is provided", () => {
    render(
      <ReceiptModal isOpen={true} onClose={vi.fn()} receiptUrl={dummyUrl} />,
    );

    // We'll search for typical media elements
    const img = screen.queryByRole("img");
    const iframe = document.querySelector("iframe");
    const object = document.querySelector("object");
    const embed = document.querySelector("embed");

    const hasMedia = img || iframe || object || embed;
    expect(hasMedia).toBeTruthy();

    // At least one of these should have the src or data attribute matching the URL
    if (hasMedia) {
      const srcAttr =
        hasMedia.getAttribute("src") || hasMedia.getAttribute("data");
      expect(srcAttr).toContain("test-receipt.pdf");
    }
  });

  it("does not render media when receiptUrl is null", () => {
    render(<ReceiptModal isOpen={true} onClose={vi.fn()} receiptUrl={null} />);

    const img = screen.queryByRole("img");
    const iframe = document.querySelector("iframe");
    const object = document.querySelector("object");
    const embed = document.querySelector("embed");

    const hasMedia = img || iframe || object || embed;
    expect(hasMedia).toBeFalsy();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onCloseMock = vi.fn();
    render(
      <ReceiptModal
        isOpen={true}
        onClose={onCloseMock}
        receiptUrl={dummyUrl}
      />,
    );

    // Assuming the developer adds a button specifically for closing
    const closeButton = screen.getByRole("button", { name: /fechar modal/i });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
  describe("Download button", () => {
    it("renders a download link in the modal header when isOpen is true and receiptUrl is provided", () => {
      render(
        <ReceiptModal isOpen={true} onClose={vi.fn()} receiptUrl={dummyUrl} />,
      );

      const heading = screen.getByRole("heading", {
        name: "Visualização de Comprovante",
      });
      // Account for the new inner div wrapper in DialogHeader
      const header = heading.parentElement?.parentElement;
      expect(header).toBeInTheDocument();

      const link = within(header as HTMLElement).getByRole("button", {
        name: /baixar comprovante/i,
      });
      expect(link).toBeInTheDocument();
    });

    it("triggers fetch and URL generation when download button is clicked", async () => {
      // Setup fetch mock
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(["dummy"], { type: "application/pdf" })),
      });
      global.URL.createObjectURL = vi.fn().mockReturnValue("blob:dummy-url");
      global.URL.revokeObjectURL = vi.fn();

      render(
        <ReceiptModal isOpen={true} onClose={vi.fn()} receiptUrl={dummyUrl} />,
      );
      // Mock document.createElement to intercept the 'a' tag click and prevent navigation error in jsdom
      const originalCreateElement = document.createElement.bind(document);
      const mockClick = vi.fn();
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const el = originalCreateElement(tagName);
        if (tagName === 'a') {
          el.click = mockClick;
        }
        return el;
      });

      const btn = screen.getByRole("button", { name: /baixar comprovante/i });
      fireEvent.click(btn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(dummyUrl);
      });
    });

    it("is not rendered if receiptUrl is null", () => {
      render(
        <ReceiptModal isOpen={true} onClose={vi.fn()} receiptUrl={null} />,
      );
      const link = screen.queryByRole("button", { name: /baixar comprovante/i });
      expect(link).not.toBeInTheDocument();
    });
  });
});
