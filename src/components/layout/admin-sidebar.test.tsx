import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminSidebar } from "./admin-sidebar";

// Mock do next/navigation e next/link
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock do componente Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string | { pathname?: string };
    [key: string]: unknown;
  }) => {
    const resolvedHref = typeof href === "object" ? href.pathname || "" : href;
    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock da action de logout
vi.mock("@/actions/auth.actions", () => ({
  logoutAction: vi.fn(),
}));

import { logoutAction } from "@/actions/auth.actions";

describe("AdminSidebar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o link 'Dashboard'", () => {
    render(<AdminSidebar />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/admin");
  });

  it("deve renderizar o botão 'Sair' e chamar a action de logout", async () => {
    render(<AdminSidebar />);

    const logoutButton = screen.getByRole("button", { name: /sair/i });
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);

    await screen.findByRole("button", { name: /sair/i });
    expect(logoutAction).toHaveBeenCalledTimes(1);
  });

  it("deve renderizar o nome e o e-mail do usuário autenticado quando user for fornecido", () => {
    render(
      <AdminSidebar
        user={{ name: "Leonardo Higuti", email: "lyhiguti@gmail.com" }}
      />,
    );

    expect(screen.getByText("Leonardo Higuti")).toBeInTheDocument();
    expect(screen.getByText("lyhiguti@gmail.com")).toBeInTheDocument();
    expect(screen.queryByText("Administrador")).not.toBeInTheDocument();
    expect(screen.queryByText("admin@bunkyo.org.br")).not.toBeInTheDocument();
  });

  it("deve exibir fallback 'Administrador' como nome e o e-mail real quando user não tiver name", () => {
    render(<AdminSidebar user={{ email: "lyhiguti@gmail.com" }} />);

    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("lyhiguti@gmail.com")).toBeInTheDocument();
    expect(screen.queryByText("admin@bunkyo.org.br")).not.toBeInTheDocument();
  });

  it("deve exibir fallback 'Administrador' como nome e o e-mail real quando user.name for null", () => {
    render(<AdminSidebar user={{ name: null, email: "lyhiguti@gmail.com" }} />);

    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("lyhiguti@gmail.com")).toBeInTheDocument();
    expect(screen.queryByText("admin@bunkyo.org.br")).not.toBeInTheDocument();
  });

  it("deve exibir fallback 'Administrador' como nome e o e-mail real quando user.name for string vazia", () => {
    render(<AdminSidebar user={{ name: "", email: "lyhiguti@gmail.com" }} />);

    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("lyhiguti@gmail.com")).toBeInTheDocument();
    expect(screen.queryByText("admin@bunkyo.org.br")).not.toBeInTheDocument();
  });

  it("deve exibir fallback 'admin@bunkyo.org.br' quando user tiver apenas name sem email", () => {
    render(<AdminSidebar user={{ name: "Leonardo Higuti" }} />);

    expect(screen.getByText("Leonardo Higuti")).toBeInTheDocument();
    expect(screen.getByText("admin@bunkyo.org.br")).toBeInTheDocument();
    expect(screen.queryByText("Administrador")).not.toBeInTheDocument();
  });

  it("deve manter os fallbacks 'Administrador' e 'admin@bunkyo.org.br' quando user não for passado", () => {
    render(<AdminSidebar />);

    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("admin@bunkyo.org.br")).toBeInTheDocument();
  });

  it("deve manter os fallbacks 'Administrador' e 'admin@bunkyo.org.br' quando user for undefined", () => {
    render(<AdminSidebar user={undefined} />);

    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("admin@bunkyo.org.br")).toBeInTheDocument();
  });
});
