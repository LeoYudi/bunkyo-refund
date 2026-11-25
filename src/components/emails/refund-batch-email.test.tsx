import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RefundRequest } from "@/models/refund.model";
import { RefundBatchEmail } from "./refund-batch-email";

const mockCjbRequests: RefundRequest[] = [
  {
    id: "req-1",
    requester_name: "Yago Soares Fernandes",
    status: "APPROVED",
    created_at: "2026-09-26T10:00:00Z",
    updated_at: "2026-09-26T10:00:00Z",
    description: "Insumos baiten DFI dia 1",
    issue_date: "2026-09-26",
    issue_number: "NF-101",
    issuer_cnpj: "12.345.678/0001-90",
    issuer_name: "Supermercado Central",
    receipt_file_url: "https://example.com/receipts/doc1.pdf",
    receiver_cnpj: "98.765.432/0001-10",
    reviewed_by: "admin-1",
    total_value: 100.0,
  },
  {
    id: "req-2",
    requester_name: "Yago Soares Fernandes",
    status: "APPROVED",
    created_at: "2026-09-27T10:00:00Z",
    updated_at: "2026-09-27T10:00:00Z",
    description: "Insumos baiten DFI dia 2",
    issue_date: "2026-09-27",
    issue_number: "NF-102",
    issuer_cnpj: "12.345.678/0001-90",
    issuer_name: "Supermercado Central",
    receipt_file_url: "https://example.com/receipts/doc2.pdf",
    receiver_cnpj: "98.765.432/0001-10",
    reviewed_by: "admin-1",
    total_value: 117.8,
  },
  {
    id: "req-3",
    requester_name: "Lucas Tamanaha Cardoso",
    status: "APPROVED",
    created_at: "2026-09-27T12:00:00Z",
    updated_at: "2026-09-27T12:00:00Z",
    description: "Descartáveis baiten",
    issue_date: "2026-09-27",
    issue_number: null,
    issuer_cnpj: null,
    issuer_name: "Atacadão Embalagens",
    receipt_file_url: "https://example.com/receipts/doc3.png",
    receiver_cnpj: null,
    reviewed_by: "admin-1",
    total_value: 213.9,
  },
];

describe("RefundBatchEmail (CJB Template)", () => {
  it("should render the greeting, event description paragraph, and shared spreadsheet paragraph", () => {
    render(
      <RefundBatchEmail
        date="27/09/2026"
        requests={mockCjbRequests}
        eventDescription="gastos com baiten do DFI 2026 que ocorreu nos dias 26 e 27/09/2026"
      />,
    );

    expect(screen.getByText("Pessoal, bom dia.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Gostaria de solicitar o reembolso referente aos gastos com baiten do DFI 2026 que ocorreu nos dias 26 e 27/09/2026.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'A planilha compartilhada "Solicitação de Reembolso de Despesas" foi preenchida com os valores e informações das notas que competem ao evento.',
      ),
    ).toBeInTheDocument();
  });

  it("should render CJB table headers ('Pessoa', 'PIX', 'Valor') and not render legacy headers ('Colaborador', 'CNPJ', 'Link do Comprovante')", () => {
    render(<RefundBatchEmail date="27/09/2026" requests={mockCjbRequests} />);

    expect(screen.getByText("Pessoa")).toBeInTheDocument();
    expect(screen.getByText("PIX")).toBeInTheDocument();
    expect(screen.getByText("Valor")).toBeInTheDocument();

    expect(screen.queryByText("Colaborador")).not.toBeInTheDocument();
    expect(screen.queryByText("CNPJ")).not.toBeInTheDocument();
    expect(screen.queryByText("Link do Comprovante")).not.toBeInTheDocument();
  });

  it("should group requests by requester_name, sum their values, display each person's PIX, and show the consolidated 'Valor total'", () => {
    render(
      <RefundBatchEmail
        date="27/09/2026"
        requests={mockCjbRequests}
        pixByRequester={{
          "Yago Soares Fernandes": "13988770722",
          "Lucas Tamanaha Cardoso": "jovens@bunkyo.org.br",
        }}
      />,
    );

    const yagoCells = screen.getAllByText("Yago Soares Fernandes");
    expect(yagoCells).toHaveLength(1);
    expect(screen.getByText("13988770722")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*217,80/)).toBeInTheDocument();

    const lucasCells = screen.getAllByText("Lucas Tamanaha Cardoso");
    expect(lucasCells).toHaveLength(1);
    expect(screen.getByText(/R\$\s*213,90/)).toBeInTheDocument();

    expect(screen.getByText(/Valor total\s*R\$\s*431,70/i)).toBeInTheDocument();
  });

  it("should render the approver mention paragraph with default and custom approverEmail", () => {
    const { rerender } = render(
      <RefundBatchEmail date="27/09/2026" requests={mockCjbRequests} />,
    );

    expect(screen.getByText(/@jaque\.hanaoka@gmail\.com/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Por gentileza, poderia revisar e aprovar esta solicitação\?/i,
      ),
    ).toBeInTheDocument();

    rerender(
      <RefundBatchEmail
        date="27/09/2026"
        requests={mockCjbRequests}
        approverEmail="aprovador@bunkyo.org.br"
      />,
    );

    expect(screen.getByText(/@aprovador@bunkyo\.org\.br/i)).toBeInTheDocument();
  });

  it("should render the default CJB signature and support custom signature props", () => {
    const { rerender } = render(
      <RefundBatchEmail date="27/09/2026" requests={mockCjbRequests} />,
    );

    expect(screen.getByText("Atenciosamente,")).toBeInTheDocument();
    expect(screen.getByText("Lucas Tamanaha")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("jovens@bunkyo.org.br")).toBeInTheDocument();
    expect(screen.getByText("(16) 99332-8607")).toBeInTheDocument();

    rerender(
      <RefundBatchEmail
        date="27/09/2026"
        requests={mockCjbRequests}
        senderName="Maria Tanaka"
        senderRole="Tesoureira CJB - Gestão 2027"
        senderEmail="financeiro.cjb@bunkyo.org.br"
        senderPhone="(11) 98888-7777"
      />,
    );

    expect(screen.getByText("Maria Tanaka")).toBeInTheDocument();
    expect(
      screen.getByText("Tesoureira CJB - Gestão 2027"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("financeiro.cjb@bunkyo.org.br"),
    ).toBeInTheDocument();
    expect(screen.getByText("(11) 98888-7777")).toBeInTheDocument();
  });
});
