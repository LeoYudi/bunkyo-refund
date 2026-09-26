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

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser = vi.fn();

    (createServerClient as Mock).mockReturnValue({
      auth: {
        getUser: mockGetUser,
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

    const response = (await updateSession(request)) as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("redirect");
    expect(response.url.pathname).toBe("/login");
  });

  it("should redirect to /login when accessing /admin/dashboard without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest("/admin/dashboard");

    const response = (await updateSession(request)) as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("redirect");
    expect(response.url.pathname).toBe("/login");
  });

  it("should allow access to /admin when session exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "123" } } });

    const request = createMockRequest("/admin/dashboard");

    const response = (await updateSession(request)) as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("next");
  });

  it("should allow access to non-admin routes without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest("/public-page");

    const response = (await updateSession(request)) as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("next");
  });

  it("should allow access to /admin-login without session (not protected)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest("/admin-login");

    const response = (await updateSession(request)) as {
      type: string;
      url?: URL;
    };

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.type).toBe("next");
  });
});
