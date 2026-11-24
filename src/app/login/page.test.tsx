import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLoginPage from "./page";

const mockPush = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

describe("AdminLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("should render a visible alert when search param reason=google_session_expired is present", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("reason=google_session_expired"),
    );

    render(<AdminLoginPage />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeVisible();
    expect(alert.textContent).toMatch(/sessão do google expirada/i);
  });

  it("should not render an alert when reason search param is absent", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    render(<AdminLoginPage />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should not render the Google session expired alert for unrelated reason values", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("reason=other"));

    render(<AdminLoginPage />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
