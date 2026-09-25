import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { SubmitRefundForm } from "./submit-refund-form";

// Mock URL.createObjectURL since ReceiptPreview uses it
beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => "mocked-url");
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("SubmitRefundForm", () => {
  it("renders an input for 'Nome Completo'", () => {
    render(<SubmitRefundForm onSubmitAction={vi.fn()} />);
    const input = screen.getByLabelText(/nome completo/i);
    expect(input).toBeInTheDocument();
  });

  it("renders the ReceiptUploader component by default", () => {
    render(<SubmitRefundForm onSubmitAction={vi.fn()} />);
    expect(
      screen.getByText(/arraste e solte o comprovante aqui/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/cancelar/i)).not.toBeInTheDocument();
  });

  it("hides uploader and shows ReceiptPreview when a valid file is selected", async () => {
    const { container } = render(<SubmitRefundForm onSubmitAction={vi.fn()} />);

    const file = new File(["dummy content"], "receipt.png", {
      type: "image/png",
    });
    const fileInput = container.querySelector("input[type='file']");
    expect(fileInput).toBeInTheDocument();
    if (!fileInput) return;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.queryByText(/arraste e solte o comprovante aqui/i),
      ).not.toBeInTheDocument();
      expect(screen.getByText("receipt.png")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancelar/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /confirmar/i }),
      ).toBeInTheDocument();
    });
  });

  it("returns to ReceiptUploader when 'Cancelar' is clicked in the preview", async () => {
    const { container } = render(<SubmitRefundForm onSubmitAction={vi.fn()} />);

    const file = new File(["dummy content"], "receipt.png", {
      type: "image/png",
    });
    const fileInput = container.querySelector("input[type='file']");
    expect(fileInput).toBeInTheDocument();
    if (!fileInput) return;

    fireEvent.change(fileInput, { target: { files: [file] } });

    const cancelButton = await screen.findByRole("button", {
      name: /cancelar/i,
    });
    fireEvent.click(cancelButton);

    expect(
      screen.getByText(/arraste e solte o comprovante aqui/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("receipt.png")).not.toBeInTheDocument();
  });

  it("triggers validation errors if 'Nome Completo' is empty on submit", async () => {
    const onSubmitAction = vi.fn();
    const { container } = render(
      <SubmitRefundForm onSubmitAction={onSubmitAction} />,
    );

    const file = new File(["dummy content"], "receipt.png", {
      type: "image/png",
    });
    const fileInput = container.querySelector("input[type='file']");
    expect(fileInput).toBeInTheDocument();
    if (!fileInput) return;

    fireEvent.change(fileInput, { target: { files: [file] } });

    const confirmButton = await screen.findByRole("button", {
      name: /confirmar/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onSubmitAction).not.toHaveBeenCalled();
    });
  });

  it("triggers validation errors if 'Nome Completo' has less than 2 characters", async () => {
    const onSubmitAction = vi.fn();
    const { container } = render(
      <SubmitRefundForm onSubmitAction={onSubmitAction} />,
    );

    const nameInput = screen.getByLabelText(/nome completo/i);
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput, { target: { value: "A" } });

    const file = new File(["dummy content"], "receipt.png", {
      type: "image/png",
    });
    const fileInput = container.querySelector("input[type='file']");
    expect(fileInput).toBeInTheDocument();
    if (!fileInput) return;

    fireEvent.change(fileInput, { target: { files: [file] } });

    const confirmButton = await screen.findByRole("button", {
      name: /confirmar/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onSubmitAction).not.toHaveBeenCalled();
    });
  });

  it("triggers validation errors if file is over 5MB", async () => {
    const onSubmitAction = vi.fn();
    const { container } = render(
      <SubmitRefundForm onSubmitAction={onSubmitAction} />,
    );

    const nameInput = screen.getByLabelText(/nome completo/i);
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // File > 5MB
    const largeContent = new Array(6 * 1024 * 1024).fill("a").join("");
    const file = new File([largeContent], "large.png", { type: "image/png" });
    const fileInput = container.querySelector("input[type='file']");
    expect(fileInput).toBeInTheDocument();
    if (!fileInput) return;

    fireEvent.change(fileInput, { target: { files: [file] } });

    const confirmButton = await screen.findByRole("button", {
      name: /confirmar/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onSubmitAction).not.toHaveBeenCalled();
    });
  });

  it("triggers validation errors if file type is invalid", async () => {
    const onSubmitAction = vi.fn();
    const { container } = render(
      <SubmitRefundForm onSubmitAction={onSubmitAction} />,
    );

    const nameInput = screen.getByLabelText(/nome completo/i);
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    const file = new File(["dummy content"], "receipt.txt", {
      type: "text/plain",
    });
    const fileInput = container.querySelector("input[type='file']");
    expect(fileInput).toBeInTheDocument();
    if (!fileInput) return;

    fireEvent.change(fileInput, { target: { files: [file] } });

    const confirmButton = await screen.findByRole("button", {
      name: /confirmar/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onSubmitAction).not.toHaveBeenCalled();
    });
  });

  it("calls onSubmitAction with a valid FormData containing requester_name and file on successful submission", async () => {
    const onSubmitAction = vi.fn().mockResolvedValue({ success: true });
    const { container } = render(
      <SubmitRefundForm onSubmitAction={onSubmitAction} />,
    );

    const nameInput = screen.getByLabelText(/nome completo/i);
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    const file = new File(["dummy content"], "receipt.png", {
      type: "image/png",
    });
    const fileInput = container.querySelector("input[type='file']");
    expect(fileInput).toBeInTheDocument();
    if (!fileInput) return;

    fireEvent.change(fileInput, { target: { files: [file] } });

    const confirmButton = await screen.findByRole("button", {
      name: /confirmar/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onSubmitAction).toHaveBeenCalledTimes(1);
    });

    const formData = onSubmitAction.mock.calls[0][0] as FormData;
    expect(formData.get("requester_name")).toBe("John Doe");
    expect(formData.get("file")).toBeInstanceOf(File);
    expect((formData.get("file") as File).name).toBe("receipt.png");
  });
});
