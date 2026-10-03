import { fireEvent, render, screen, within } from "@testing-library/react";
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
    const closeButtons = screen.getAllByRole("button");
    expect(closeButtons.length).toBeGreaterThan(0);

    fireEvent.click(closeButtons[0]);
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
      const header = heading.parentElement;
      expect(header).toBeInTheDocument();

      const link = within(header as HTMLElement).getByRole("link", {
        name: /baixar comprovante/i,
      });
      expect(link).toBeInTheDocument();
    });

    it("has the correct href and download attributes", () => {
      render(
        <ReceiptModal isOpen={true} onClose={vi.fn()} receiptUrl={dummyUrl} />,
      );
      const link = screen.getByRole("link", { name: /baixar comprovante/i });
      expect(link).toHaveAttribute("href", dummyUrl);
      expect(link).toHaveAttribute("download");
    });

    it("is not rendered if receiptUrl is null", () => {
      render(
        <ReceiptModal isOpen={true} onClose={vi.fn()} receiptUrl={null} />,
      );
      const link = screen.queryByRole("link", { name: /baixar comprovante/i });
      expect(link).not.toBeInTheDocument();
    });
  });
});
