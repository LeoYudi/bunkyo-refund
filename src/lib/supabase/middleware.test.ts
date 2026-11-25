import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { updateSession } from "./middleware";

// Mock next/server
vi.mock("next/server", () => {
  return {
    NextResponse: {
      next: vi.fn(),
      redirect: vi.fn(),
    },
  };
});

// Mock @supabase/ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

describe("Middleware (updateSession)", () => {
  let mockGetUser: Mock;
  let mockGetSession: Mock;
  let mockSignOut: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser = vi.fn();
    mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
    mockSignOut = vi.fn().mockResolvedValue({ error: null });

    (createServerClient as Mock).mockReturnValue({
      auth: {
        getUser: mockGetUser,
        getSession: mockGetSession,
        signOut: mockSignOut,
      },
    });

    (NextResponse.next as Mock).mockImplementation((opts) => ({
      ...opts,
      type: "next",
      cookies: {
        set: vi.fn(),
        get: vi.fn(),
        getAll: vi.fn(),
        delete: vi.fn(),
      },
    }));
    (NextResponse.redirect as Mock).mockImplementation((url) => ({
      url,
      type: "redirect",
    }));
  });

  const createMockRequest = (pathname: string) => {
    return {
      nextUrl: {
        pathname,
        clone() {
          return new URL(`http://localhost${pathname}`);
        },
      },
      url: `http://localhost${pathname}`,
      headers: new Headers(),
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
    } as unknown as NextRequest;
  };

  it("should redirect to /login when accessing /admin exactly without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest("/admin");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("redirect");
    expect((response as unknown as { url: URL }).url.pathname).toBe("/login");
  });

  it("should redirect to /login when accessing /admin/dashboard without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest("/admin/dashboard");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("redirect");
    expect((response as unknown as { url: URL }).url.pathname).toBe("/login");
  });

  it("should allow access to /admin when session exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "123", email: "admin@bunkyo.org.br" } },
    });

    const request = createMockRequest("/admin/dashboard");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("next");
  });

  it("should allow access to non-admin routes without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest("/public-page");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("next");
  });

  it("should allow access to /admin-login without session (not protected)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest("/admin-login");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("next");
  });

  it("should sign out and redirect to /login?reason=google_session_expired when accessing /admin as Google user with null provider_token", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
          email: "admin@bunkyo.org.br",
          app_metadata: { provider: "google" },
        },
      },
    });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          provider_token: null,
        },
      },
    });

    const request = createMockRequest("/admin");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.type).toBe("redirect");
    expect(response.url?.pathname).toBe("/login");
    expect(response.url?.searchParams.get("reason")).toBe(
      "google_session_expired",
    );
  });

  it("should sign out and redirect to /login?reason=google_session_expired when accessing /admin/dashboard as Google user with undefined provider_token", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
          email: "admin@bunkyo.org.br",
          app_metadata: { provider: "google" },
        },
      },
    });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          provider_token: undefined,
        },
      },
    });

    const request = createMockRequest("/admin/dashboard");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.type).toBe("redirect");
    expect(response.url?.pathname).toBe("/login");
    expect(response.url?.searchParams.get("reason")).toBe(
      "google_session_expired",
    );
  });

  it("should allow access to /admin when Google user has valid provider_token", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
          email: "admin@bunkyo.org.br",
          app_metadata: { provider: "google" },
        },
      },
    });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          provider_token: "valid-token",
        },
      },
    });

    const request = createMockRequest("/admin");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(response.type).toBe("next");
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("should allow access to /admin when email user has no provider_token", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
          email: "admin@bunkyo.org.br",
          app_metadata: { provider: "email" },
        },
      },
    });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          provider_token: null,
        },
      },
    });

    const request = createMockRequest("/admin");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(response.type).toBe("next");
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("should allow access to /admin/dashboard when logged-in user has exception email lyhiguti@gmail.com", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
          email: "lyhiguti@gmail.com",
        },
      },
    });

    const request = createMockRequest("/admin/dashboard");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(response.type).toBe("next");
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("should sign out and redirect to /login?error=unauthorized_email when accessing /admin with unauthorized email", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
          email: "outro@gmail.com",
        },
      },
    });

    const request = createMockRequest("/admin");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.type).toBe("redirect");
    expect(response.url?.pathname).toBe("/login");
    expect(response.url?.searchParams.get("error")).toBe("unauthorized_email");
  });

  it("should sign out and redirect to /login?error=unauthorized_email when accessing /admin/dashboard with unauthorized Google email", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
          email: "outro@gmail.com",
          app_metadata: { provider: "google" },
        },
      },
    });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          provider_token: "valid-token",
        },
      },
    });

    const request = createMockRequest("/admin/dashboard");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.type).toBe("redirect");
    expect(response.url?.pathname).toBe("/login");
    expect(response.url?.searchParams.get("error")).toBe("unauthorized_email");
  });

  it("should sign out and redirect to /login?error=unauthorized_email when accessing /admin with missing user email", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "123",
        },
      },
    });

    const request = createMockRequest("/admin");

    const response = (await updateSession(request)) as unknown as {
      type: string;
      url?: URL;
    };

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.type).toBe("redirect");
    expect(response.url?.pathname).toBe("/login");
    expect(response.url?.searchParams.get("error")).toBe("unauthorized_email");
  });
});
