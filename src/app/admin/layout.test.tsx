import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "./layout";

const { mockAdminSidebar } = vi.hoisted(() => ({
  mockAdminSidebar: vi.fn(
    (_props: {
      user?: { name?: string | null; email?: string | null } | null;
    }) => <div data-testid="mock-admin-sidebar">Mock Sidebar</div>,
  ),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock the child components to test if they are rendered by the layout
vi.mock("@/components/layout/admin-sidebar", () => ({
  AdminSidebar: mockAdminSidebar,
}));

vi.mock("@/components/layout/admin-header", () => ({
  AdminHeader: () => <div data-testid="mock-admin-header">Mock Header</div>,
}));

describe("AdminLayout Component", () => {
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "admin@bunkyo.org.br",
          user_metadata: { full_name: "Administrador" },
        },
      },
      error: null,
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("deve renderizar a Sidebar, o Header e os children", async () => {
    const dummyChild = <div data-testid="dummy-child">Child Content</div>;

    const ui = await AdminLayout({ children: dummyChild });
    render(ui);

    // Check if Sidebar is rendered
    expect(screen.getByTestId("mock-admin-sidebar")).toBeInTheDocument();

    // Check if Header is rendered
    expect(screen.getByTestId("mock-admin-header")).toBeInTheDocument();

    // Check if Children are rendered
    expect(screen.getByTestId("dummy-child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("deve buscar o usuário autenticado via Supabase e passar user_metadata.full_name e email para a AdminSidebar", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "lyhiguti@gmail.com",
          user_metadata: {
            full_name: "Leonardo Higuti",
            name: "Leo",
          },
        },
      },
      error: null,
    });

    const ui = await AdminLayout({
      children: <div>Child Content</div>,
    });
    render(ui);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockAdminSidebar).toHaveBeenCalledTimes(1);
    expect(mockAdminSidebar.mock.calls[0]?.[0]).toEqual({
      user: {
        name: "Leonardo Higuti",
        email: "lyhiguti@gmail.com",
      },
    });
  });

  it("deve usar user_metadata.name quando user_metadata.full_name estiver ausente", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-456",
          email: "maria@bunkyo.org.br",
          user_metadata: {
            name: "Maria Silva",
          },
        },
      },
      error: null,
    });

    const ui = await AdminLayout({
      children: <div>Child Content</div>,
    });
    render(ui);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockAdminSidebar).toHaveBeenCalledTimes(1);
    expect(mockAdminSidebar.mock.calls[0]?.[0]).toEqual({
      user: {
        name: "Maria Silva",
        email: "maria@bunkyo.org.br",
      },
    });
  });

  it("deve usar fallback 'Administrador' como nome quando user_metadata não possuir nome", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-789",
          email: "financeiro@bunkyo.org.br",
          user_metadata: {},
        },
      },
      error: null,
    });

    const ui = await AdminLayout({
      children: <div>Child Content</div>,
    });
    render(ui);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockAdminSidebar).toHaveBeenCalledTimes(1);
    expect(mockAdminSidebar.mock.calls[0]?.[0]).toEqual({
      user: {
        name: "Administrador",
        email: "financeiro@bunkyo.org.br",
      },
    });
  });

  it("deve usar fallback 'Administrador' como nome quando user_metadata for undefined", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-999",
          email: "contato@bunkyo.org.br",
        },
      },
      error: null,
    });

    const ui = await AdminLayout({
      children: <div>Child Content</div>,
    });
    render(ui);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockAdminSidebar).toHaveBeenCalledTimes(1);
    expect(mockAdminSidebar.mock.calls[0]?.[0]).toEqual({
      user: {
        name: "Administrador",
        email: "contato@bunkyo.org.br",
      },
    });
  });

  it("não deve quebrar e deve passar fallback adequado ou undefined para AdminSidebar quando user for null", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const ui = await AdminLayout({
      children: <div>Child Content</div>,
    });
    render(ui);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mock-admin-sidebar")).toBeInTheDocument();
    expect(mockAdminSidebar).toHaveBeenCalledTimes(1);

    const passedProps = mockAdminSidebar.mock.calls[0]?.[0];
    if (passedProps?.user !== undefined && passedProps?.user !== null) {
      expect(passedProps.user.name ?? "Administrador").toBe("Administrador");
      expect(passedProps.user.email ?? "admin@bunkyo.org.br").toBe(
        "admin@bunkyo.org.br",
      );
    }
  });

  it("não deve quebrar quando getUser retornar erro com user null", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });

    const ui = await AdminLayout({
      children: <div>Child Content</div>,
    });
    render(ui);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mock-admin-sidebar")).toBeInTheDocument();
    expect(mockAdminSidebar).toHaveBeenCalledTimes(1);

    const passedProps = mockAdminSidebar.mock.calls[0]?.[0];
    if (passedProps?.user !== undefined && passedProps?.user !== null) {
      expect(passedProps.user.name ?? "Administrador").toBe("Administrador");
      expect(passedProps.user.email ?? "admin@bunkyo.org.br").toBe(
        "admin@bunkyo.org.br",
      );
    }
  });
});
