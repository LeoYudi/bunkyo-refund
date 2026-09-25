import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CameraCapture } from "./camera-capture";

describe("CameraCapture Component", () => {
  it('renders a "Tirar Foto" button', () => {
    render(<CameraCapture onCapture={vi.fn()} />);
    const button = screen.queryByText(/tirar foto/i);
    expect(button).not.toBeNull();
  });

  it('has a hidden input with capture="environment" and accept="image/*"', () => {
    const { container } = render(<CameraCapture onCapture={vi.fn()} />);
    const cameraInput = container.querySelector(
      'input[type="file"][capture="environment"]',
    ) as HTMLInputElement;
    expect(cameraInput).not.toBeNull();
    if (cameraInput) {
      expect(cameraInput.accept).toContain("image/*");
      // Check if it's visually hidden
      expect(cameraInput.className).toContain("hidden");
    }
  });

  it('simulates opening the camera file dialog when "Tirar Foto" is clicked', () => {
    const { container } = render(<CameraCapture onCapture={vi.fn()} />);
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

  it("calls onCapture when a file is selected", () => {
    const onCaptureMock = vi.fn();
    const { container } = render(<CameraCapture onCapture={onCaptureMock} />);
    const cameraInput = container.querySelector(
      'input[type="file"][capture="environment"]',
    ) as HTMLInputElement;

    expect(cameraInput).not.toBeNull();

    if (cameraInput) {
      const file = new File(["dummy content"], "photo.png", {
        type: "image/png",
      });
      fireEvent.change(cameraInput, { target: { files: [file] } });
      expect(onCaptureMock).toHaveBeenCalledWith(file);
    }
  });
});
