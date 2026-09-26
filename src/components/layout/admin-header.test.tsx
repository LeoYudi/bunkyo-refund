import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminHeader } from "./admin-header";

describe("AdminHeader Component", () => {
  it("deve renderizar o título do painel", () => {
    render(<AdminHeader />);

    // Pode ser um <h1>, <h2> ou apenas um texto. Procuramos por um texto relevante.
    const title = screen.getByText(/painel admin/i);
    expect(title).toBeInTheDocument();
  });

  it("deve renderizar a informação do usuário (ou placeholder)", () => {
    render(<AdminHeader />);

    const userInfo = screen.getByText(/admin/i);
    expect(userInfo).toBeInTheDocument();
  });
});
