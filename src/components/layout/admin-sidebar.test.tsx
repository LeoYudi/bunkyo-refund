import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

// Mock da action de logout (suposição de onde ficará)
vi.mock("@/actions/auth.actions", () => ({
  logoutAction: vi.fn(),
}));

import { logoutAction } from "@/actions/auth.actions";

describe("AdminSidebar Component", () => {
  it("deve renderizar o link 'Solicitações'", () => {
    render(<AdminSidebar />);

    const solicitacoesLink = screen.getByRole("link", {
      name: /solicitações/i,
    });
    expect(solicitacoesLink).toBeInTheDocument();
    expect(solicitacoesLink).toHaveAttribute("href", "/admin/requests");
  });

  it("deve renderizar o botão 'Sair' e chamar a action de logout", () => {
    render(<AdminSidebar />);

    const logoutButton = screen.getByRole("button", { name: /sair/i });
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);
    expect(logoutAction).toHaveBeenCalledTimes(1);
  });
});
