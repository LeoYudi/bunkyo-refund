import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("GET /auth/callback", () => {
  const mockExchangeCodeForSession = vi.fn();
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockSignOut.mockResolvedValue({ error: null });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
        signOut: mockSignOut,
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("should redirect to /admin without signing out when code is valid for @bunkyo.org.br email", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { email: "admin@bunkyo.org.br" } },
      error: null,
    });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=valid-code",
    );
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin",
    );
  });

  it("should redirect to /admin without signing out when code is valid for exception email lyhiguti@gmail.com", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { email: "lyhiguti@gmail.com" } },
      error: null,
    });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=valid-code",
    );
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin",
    );
  });

  it("should sign out and redirect to /login?error=unauthorized_email when email is not allowed", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { email: "intruso@gmail.com" } },
      error: null,
    });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=valid-code",
    );
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=unauthorized_email",
    );
  });

  it("should sign out and redirect to /login?error=unauthorized_email when user email is null", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { email: null } },
      error: null,
    });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=valid-code",
    );
    const response = await GET(request);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=unauthorized_email",
    );
  });

  it("should redirect to /login?error=auth-callback-failed when code is missing", async () => {
    const request = new Request("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(createClient).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth-callback-failed",
    );
  });

  it("should redirect to /login?error=auth-callback-failed when exchangeCodeForSession returns an error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid authorization code" },
    });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=invalid-code",
    );
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("invalid-code");
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth-callback-failed",
    );

    consoleErrorSpy.mockRestore();
  });
});
