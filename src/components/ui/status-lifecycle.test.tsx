import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusLifecycle } from "./status-lifecycle";

describe("StatusLifecycle", () => {
  it("should render the status lifecycle section title", () => {
    render(<StatusLifecycle />);

    expect(
      screen.getByRole("heading", { name: /ciclo de status/i }),
    ).toBeInTheDocument();
  });

  it("should render all 6 status badges with their semantic color classes", () => {
    const { container } = render(<StatusLifecycle />);

    const badges = container.querySelectorAll('[data-slot="badge"]');
    expect(badges).toHaveLength(6);

    const expectedBadges = [
      { label: "Pendente", colorPattern: /gray|zinc|neutral|muted|slate/i },
      { label: "Processando", colorPattern: /amber|yellow/i },
      { label: "Aprovado", colorPattern: /blue/i },
      { label: "Enviado", colorPattern: /purple|violet/i },
      { label: "Pago", colorPattern: /emerald|green/i },
      { label: "Negado", colorPattern: /red|destructive/i },
    ];

    for (const { label, colorPattern } of expectedBadges) {
      const badgeText = screen.getByText(label);
      const badge = badgeText.closest('[data-slot="badge"]') ?? badgeText;
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge.className).toMatch(colorPattern);
    }
  });

  it("should render the explanatory description for each of the 6 statuses", () => {
    render(<StatusLifecycle />);

    expect(
      screen.getByText(
        /recebido do formulário público e aguardando triagem do administrador/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /nota fiscal em leitura e extração de dados pela ia \(gemini\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /dados extraídos e validados, pronto para envio em lote/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /lote consolidado e encaminhado por e-mail ao financeiro/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/reembolso efetuado e concluído pelo financeiro/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pedido recusado ou invalidado na triagem/i),
    ).toBeInTheDocument();
  });

  it("should render the main lifecycle steps in sequential order (Pendente -> Processando -> Aprovado -> Enviado -> Pago)", () => {
    render(<StatusLifecycle />);

    const mainFlowLabels = [
      "Pendente",
      "Processando",
      "Aprovado",
      "Enviado",
      "Pago",
    ];
    const elements = mainFlowLabels.map((label) => screen.getByText(label));

    for (let i = 0; i < elements.length - 1; i++) {
      const position = elements[i].compareDocumentPosition(elements[i + 1]);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("should render flow progression indicators between main steps and indicate the Denied branch", () => {
    const { container } = render(<StatusLifecycle />);

    // Should have visual arrow/connector icons (at least 4 between the 5 main steps)
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(4);

    // Should indicate the branch/exception path for "Negado"
    const deniedBadge = screen.getByText("Negado");
    expect(deniedBadge).toBeInTheDocument();
    expect(
      screen.getAllByText(/exceção|desvio|recusa|fluxo alternativo|triagem/i)
        .length,
    ).toBeGreaterThanOrEqual(1);
  });
});
