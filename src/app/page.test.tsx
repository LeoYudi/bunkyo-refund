import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import Home from "./page";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe("Home Page (/)", () => {
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("should redirect to /admin when user is authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "admin@bunkyo.org.br" } },
    });

    await expect(
      (async () => {
        await Home();
      })(),
    ).rejects.toThrow("NEXT_REDIRECT:/admin");

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/admin");
  });

  it("should redirect to /login when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    await expect(
      (async () => {
        await Home();
      })(),
    ).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("should redirect to /login when getUser returns an auth error and user is null", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });

    await expect(
      (async () => {
        await Home();
      })(),
    ).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
