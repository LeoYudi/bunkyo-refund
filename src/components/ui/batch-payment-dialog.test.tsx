import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RefundRequest } from "@/models/refund.model";
import type { EmailSettings } from "@/models/settings.model";
import { BatchPaymentDialog } from "./batch-payment-dialog";

const mockSelectedRequests: RefundRequest[] = [
  {
    id: "req-1",
    requester_name: "Alice Silva",
    status: "APPROVED",
    created_at: new Date("2026-09-25T10:00:00Z").toISOString(),
    updated_at: new Date("2026-09-25T10:00:00Z").toISOString(),
    description: "Almoço da equipe",
    issue_date: "2026-09-25",
    issue_number: "NF-100",
    issuer_cnpj: "12.345.678/0001-90",
    issuer_name: "Restaurante Sabor",
    receipt_file_url: "https://example.com/receipt1.pdf",
    receiver_cnpj: null,
    reviewed_by: "admin-1",
    total_value: 100.0,
  },
  {
    id: "req-2",
    requester_name: "Alice Silva",
    status: "APPROVED",
    created_at: new Date("2026-09-25T12:00:00Z").toISOString(),
    updated_at: new Date("2026-09-25T12:00:00Z").toISOString(),
    description: "Sobremesa equipe",
    issue_date: "2026-09-25",
    issue_number: "NF-102",
    issuer_cnpj: "12.345.678/0001-90",
    issuer_name: "Restaurante Sabor",
    receipt_file_url: "https://example.com/receipt1b.pdf",
    receiver_cnpj: null,
    reviewed_by: "admin-1",
    total_value: 50.5,
  },
  {
    id: "req-3",
    requester_name: "Bob Santos",
    status: "APPROVED",
    created_at: new Date("2026-09-26T10:00:00Z").toISOString(),
    updated_at: new Date("2026-09-26T10:00:00Z").toISOString(),
    description: "Transporte evento",
    issue_date: "2026-09-26",
    issue_number: "NF-101",
    issuer_cnpj: "98.765.432/0001-10",
    issuer_name: "Fretamento Express",
    receipt_file_url: "https://example.com/receipt2.pdf",
    receiver_cnpj: null,
    reviewed_by: "admin-1",
    total_value: 450.0,
  },
];

describe("BatchPaymentDialog", () => {
  it("should render using Shadcn Dialog (role='dialog') when isOpen is true and not render when isOpen is false", () => {
    const { rerender } = render(
      <BatchPaymentDialog
        isOpen={false}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Enviar Pagamentos em Lote")).toBeInTheDocument();
  });

  it("should group multiple requests from the same requester_name, sum their BRL amounts, render 1 PIX input per unique person, and display consolidated total value", () => {
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
      />,
    );

    expect(
      screen.getByText(/3 solicitaç(ões|oes) selecionadas/i),
    ).toBeInTheDocument();

    const aliceEntries = screen.getAllByText("Alice Silva");
    expect(aliceEntries).toHaveLength(1);
    expect(screen.getByText(/R\$\s*150,50/)).toBeInTheDocument();
    expect(screen.getByLabelText(/PIX de Alice Silva/i)).toBeInTheDocument();

    const bobEntries = screen.getAllByText("Bob Santos");
    expect(bobEntries).toHaveLength(1);
    expect(screen.getByText(/R\$\s*450,00/)).toBeInTheDocument();
    expect(screen.getByLabelText(/PIX de Bob Santos/i)).toBeInTheDocument();

    expect(screen.getByText(/R\$\s*600,50/)).toBeInTheDocument();
  });

  it("should display singular count text when 1 request is selected", () => {
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={[mockSelectedRequests[0]]}
      />,
    );

    expect(
      screen.getByText(/1 solicitaç(ão|ao) selecionada/i),
    ).toBeInTheDocument();
  });

  it("should render editable CJB email fields (Assunto, Descrição do Evento, E-mail para Aprovação/Menção, and Assinatura fields with defaults)", () => {
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
      />,
    );

    expect(screen.getByLabelText(/Assunto/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Descrição do Evento|Gastos/i),
    ).toBeInTheDocument();

    const approverInput = screen.getByLabelText(
      /E-mail para Aprovação|Menção/i,
    ) as HTMLInputElement;
    expect(approverInput).toBeInTheDocument();
    expect(approverInput.value).toBe("jaque.hanaoka@gmail.com");

    const senderNameInput = screen.getByLabelText(
      /Nome na Assinatura/i,
    ) as HTMLInputElement;
    expect(senderNameInput).toBeInTheDocument();
    expect(senderNameInput.value).toBe("Lucas Tamanaha");

    const senderRoleInput = screen.getByLabelText(
      /Cargo na Assinatura/i,
    ) as HTMLInputElement;
    expect(senderRoleInput).toBeInTheDocument();
    expect(senderRoleInput.value).toBe(
      "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
    );

    const senderPhoneInput = screen.getByLabelText(
      /Telefone na Assinatura/i,
    ) as HTMLInputElement;
    expect(senderPhoneInput).toBeInTheDocument();
    expect(senderPhoneInput.value).toBe("(16) 99332-8607");
  });

  it("should call onClose when 'Cancelar' button is clicked", () => {
    const onClose = vi.fn();
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={onClose}
        selectedRequests={mockSelectedRequests}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should pass recipientEmail, cc, bcc, and metadata (subject, eventDescription, approverEmail, pixByRequester, senderName, senderRole, senderPhone) to onConfirm when 'Confirmar Envio' is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
        onConfirm={onConfirm}
      />,
    );

    const emailInput = screen.getByPlaceholderText(
      /e-mail|destinatário|financeiro/i,
    );
    const ccInput = screen.getByLabelText(/Cc \(Cópia\)/i);
    const bccInput = screen.getByLabelText(/Cco \(Cópia Oculta\)/i);
    const subjectInput = screen.getByLabelText(/Assunto/i);
    const eventDescInput = screen.getByLabelText(/Descrição do Evento|Gastos/i);
    const approverInput = screen.getByLabelText(
      /E-mail para Aprovação|Menção/i,
    );
    const alicePixInput = screen.getByLabelText(/PIX de Alice Silva/i);
    const bobPixInput = screen.getByLabelText(/PIX de Bob Santos/i);
    const senderNameInput = screen.getByLabelText(/Nome na Assinatura/i);
    const senderRoleInput = screen.getByLabelText(/Cargo na Assinatura/i);
    const senderPhoneInput = screen.getByLabelText(/Telefone na Assinatura/i);

    fireEvent.change(emailInput, {
      target: { value: "financeiro@bunkyo.org.br" },
    });
    fireEvent.change(ccInput, {
      target: { value: "gestor@bunkyo.org.br, fiscal@bunkyo.org.br" },
    });
    fireEvent.change(bccInput, {
      target: { value: "diretoria@bunkyo.org.br" },
    });
    fireEvent.change(subjectInput, {
      target: { value: "Reembolso CJB - DFI 2026" },
    });
    fireEvent.change(eventDescInput, {
      target: {
        value:
          "gastos com baiten do DFI 2026 que ocorreu nos dias 26 e 27/09/2026",
      },
    });
    fireEvent.change(approverInput, {
      target: { value: "jaque.hanaoka@gmail.com" },
    });
    fireEvent.change(alicePixInput, {
      target: { value: "13988770722" },
    });
    fireEvent.change(bobPixInput, {
      target: { value: "jovens@bunkyo.org.br" },
    });
    fireEvent.change(senderNameInput, {
      target: { value: "Lucas Tamanaha" },
    });
    fireEvent.change(senderRoleInput, {
      target: {
        value:
          "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
      },
    });
    fireEvent.change(senderPhoneInput, {
      target: { value: "(16) 99332-8607" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /confirmar envio/i }));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(
      mockSelectedRequests,
      "financeiro@bunkyo.org.br",
      "gestor@bunkyo.org.br, fiscal@bunkyo.org.br",
      "diretoria@bunkyo.org.br",
      expect.objectContaining({
        subject: "Reembolso CJB - DFI 2026",
        eventDescription:
          "gastos com baiten do DFI 2026 que ocorreu nos dias 26 e 27/09/2026",
        approverEmail: "jaque.hanaoka@gmail.com",
        pixByRequester: {
          "Alice Silva": "13988770722",
          "Bob Santos": "jovens@bunkyo.org.br",
        },
        senderName: "Lucas Tamanaha",
        senderRole:
          "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
        senderPhone: "(16) 99332-8607",
      }),
    );
  });

  it("should pre-fill form fields from defaultSettings and pass custom template texts in metadata on confirm", async () => {
    const onConfirm = vi.fn();
    const mockDefaultSettings: EmailSettings = {
      id: "settings-1",
      recipient_email: "tesouraria@bunkyo.org.br",
      cc_email: "presidente@bunkyo.org.br",
      bcc_email: "arquivo@bunkyo.org.br",
      subject_prefix: "Reembolso Eventos - ",
      default_event_description: "gastos com o Haru Matsuri 2026",
      greeting_text: "Olá pessoal da tesouraria,",
      intro_text_template:
        "Encaminho o pedido de reembolso referente aos {eventDescription}.",
      spreadsheet_text: "A planilha do evento foi preenchida no Google Drive.",
      approver_email: "aprovador.cjb@bunkyo.org.br",
      approval_request_text: "Favor validar e aprovar este lote.",
      closing_text: "Abraços,",
      sender_name: "Kenji Takahashi",
      sender_role: "Tesoureiro CJB - Gestão 2026",
      sender_email: "kenji@bunkyo.org.br",
      sender_phone: "(11) 99999-1234",
      updated_at: "2026-11-26T10:00:00Z",
    };

    render(
      <BatchPaymentDialog
        isOpen={true}
        onClose={() => {}}
        selectedRequests={mockSelectedRequests}
        defaultSettings={mockDefaultSettings}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByLabelText(/E-mail do Financeiro/i)).toHaveValue(
      "tesouraria@bunkyo.org.br",
    );
    expect(screen.getByLabelText(/Cc \(Cópia\)/i)).toHaveValue(
      "presidente@bunkyo.org.br",
    );
    expect(screen.getByLabelText(/Cco \(Cópia Oculta\)/i)).toHaveValue(
      "arquivo@bunkyo.org.br",
    );
    expect(screen.getByLabelText(/Assunto/i)).toHaveValue(
      "Reembolso Eventos - ",
    );
    expect(screen.getByLabelText(/Descrição do Evento|Gastos/i)).toHaveValue(
      "gastos com o Haru Matsuri 2026",
    );
    expect(screen.getByLabelText(/E-mail para Aprovação|Menção/i)).toHaveValue(
      "aprovador.cjb@bunkyo.org.br",
    );
    expect(screen.getByLabelText(/Nome na Assinatura/i)).toHaveValue(
      "Kenji Takahashi",
    );
    expect(screen.getByLabelText(/Cargo na Assinatura/i)).toHaveValue(
      "Tesoureiro CJB - Gestão 2026",
    );
    expect(screen.getByLabelText(/Telefone na Assinatura/i)).toHaveValue(
      "(11) 99999-1234",
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /confirmar envio/i }));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(
      mockSelectedRequests,
      "tesouraria@bunkyo.org.br",
      "presidente@bunkyo.org.br",
      "arquivo@bunkyo.org.br",
      expect.objectContaining({
        subject: "Reembolso Eventos - ",
        eventDescription: "gastos com o Haru Matsuri 2026",
        approverEmail: "aprovador.cjb@bunkyo.org.br",
        senderName: "Kenji Takahashi",
        senderRole: "Tesoureiro CJB - Gestão 2026",
        senderEmail: "kenji@bunkyo.org.br",
        senderPhone: "(11) 99999-1234",
        greetingText: "Olá pessoal da tesouraria,",
        introTextTemplate:
          "Encaminho o pedido de reembolso referente aos {eventDescription}.",
        spreadsheetText: "A planilha do evento foi preenchida no Google Drive.",
        approvalRequestText: "Favor validar e aprovar este lote.",
        closingText: "Abraços,",
      }),
    );
  });
});
