import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveEmailSettingsAction } from "@/actions/settings.actions";
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
} from "@/models/settings.model";
import { EmailSettingsForm } from "./email-settings-form";

vi.mock("@/actions/settings.actions", () => ({
  saveEmailSettingsAction: vi.fn(),
}));

const mockInitialSettings: EmailSettings = {
  id: "settings-1",
  recipient_email: "financeiro@bunkyo.org.br",
  cc_email: "gestor@bunkyo.org.br",
  bcc_email: "diretoria@bunkyo.org.br",
  subject_prefix: "Reembolso Eventos - ",
  default_event_description: "gastos do DFI 2026",
  greeting_text: "Olá pessoal,",
  intro_text_template: "Solicito reembolso referente aos {eventDescription}.",
  spreadsheet_text: "Planilha preenchida no Drive.",
  approver_email: "aprovador@bunkyo.org.br",
  approval_request_text: "Favor aprovar este lote.",
  closing_text: "Abraços,",
  sender_name: "Maria Tanaka",
  sender_role: "Tesoureira CJB - Gestão 2026",
  sender_email: "tesouraria@bunkyo.org.br",
  sender_phone: "(11) 98888-7777",
  updated_at: "2026-11-26T10:00:00Z",
};

describe("EmailSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(saveEmailSettingsAction).mockResolvedValue({
      success: true,
      data: mockInitialSettings,
    });
  });

  it("should render all 15 editable fields with accessible labels and initialSettings values", () => {
    render(<EmailSettingsForm initialSettings={mockInitialSettings} />);

    expect(screen.getByLabelText(/Para\s*\/\s*Destinatário/i)).toHaveValue(
      mockInitialSettings.recipient_email,
    );
    expect(screen.getByLabelText(/^Cc\b/i)).toHaveValue(
      mockInitialSettings.cc_email,
    );
    expect(screen.getByLabelText(/^Cco\b/i)).toHaveValue(
      mockInitialSettings.bcc_email,
    );
    expect(screen.getByLabelText(/Padrão de Assunto/i)).toHaveValue(
      mockInitialSettings.subject_prefix,
    );
    expect(screen.getByLabelText(/Descrição Padrão do Evento/i)).toHaveValue(
      mockInitialSettings.default_event_description,
    );
    expect(screen.getByLabelText(/Saudação/i)).toHaveValue(
      mockInitialSettings.greeting_text,
    );
    expect(screen.getByLabelText(/Texto Introdutório/i)).toHaveValue(
      mockInitialSettings.intro_text_template,
    );
    expect(screen.getByLabelText(/Texto da Planilha/i)).toHaveValue(
      mockInitialSettings.spreadsheet_text,
    );
    expect(screen.getByLabelText(/E-mail de Aprovação/i)).toHaveValue(
      mockInitialSettings.approver_email,
    );
    expect(screen.getByLabelText(/Texto de Aprovação/i)).toHaveValue(
      mockInitialSettings.approval_request_text,
    );
    expect(screen.getByLabelText(/Despedida/i)).toHaveValue(
      mockInitialSettings.closing_text,
    );
    expect(screen.getByLabelText(/^Nome\b/i)).toHaveValue(
      mockInitialSettings.sender_name,
    );
    expect(screen.getByLabelText(/^Cargo\b/i)).toHaveValue(
      mockInitialSettings.sender_role,
    );
    expect(screen.getByLabelText(/E-mail na Assinatura/i)).toHaveValue(
      mockInitialSettings.sender_email,
    );
    expect(screen.getByLabelText(/^Telefone\b/i)).toHaveValue(
      mockInitialSettings.sender_phone,
    );
  });

  it("should update EmailPreviewCard in real time on the same screen when typing in form fields", () => {
    render(<EmailSettingsForm initialSettings={mockInitialSettings} />);

    fireEvent.change(screen.getByLabelText(/Para\s*\/\s*Destinatário/i), {
      target: { value: "contabilidade@bunkyo.org.br" },
    });
    fireEvent.change(screen.getByLabelText(/Padrão de Assunto/i), {
      target: { value: "Reembolso Haru - " },
    });
    fireEvent.change(screen.getByLabelText(/Descrição Padrão do Evento/i), {
      target: { value: "gastos do Haru Matsuri" },
    });
    fireEvent.change(screen.getByLabelText(/Saudação/i), {
      target: { value: "Bom dia equipe," },
    });
    fireEvent.change(screen.getByLabelText(/Texto Introdutório/i), {
      target: { value: "Novo pedido referente aos {eventDescription}." },
    });
    fireEvent.change(screen.getByLabelText(/E-mail de Aprovação/i), {
      target: { value: "presidente@bunkyo.org.br" },
    });
    fireEvent.change(screen.getByLabelText(/^Nome\b/i), {
      target: { value: "Kenji Takahashi" },
    });

    expect(
      screen.getByText(/contabilidade@bunkyo\.org\.br/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Reembolso Haru -/i)).toBeInTheDocument();
    expect(screen.getByText("Bom dia equipe,")).toBeInTheDocument();
    expect(
      screen.getByText("Novo pedido referente aos gastos do Haru Matsuri."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/@presidente@bunkyo\.org\.br/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Kenji Takahashi")).toBeInTheDocument();
    expect(screen.getByText("Pessoa")).toBeInTheDocument();
    expect(screen.getByText("PIX")).toBeInTheDocument();
    expect(screen.getByText("Valor")).toBeInTheDocument();
  });

  it("should call saveEmailSettingsAction with current values and show success feedback when 'Salvar Configurações' is clicked", async () => {
    const savedPayload: EmailSettings = {
      ...mockInitialSettings,
      recipient_email: "novo@bunkyo.org.br",
      sender_name: "Pedro Yamamoto",
    };

    vi.mocked(saveEmailSettingsAction).mockResolvedValueOnce({
      success: true,
      data: savedPayload,
    });

    render(<EmailSettingsForm initialSettings={mockInitialSettings} />);

    fireEvent.change(screen.getByLabelText(/Para\s*\/\s*Destinatário/i), {
      target: { value: "novo@bunkyo.org.br" },
    });
    fireEvent.change(screen.getByLabelText(/^Nome\b/i), {
      target: { value: "Pedro Yamamoto" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Salvar Configurações/i }),
    );

    await waitFor(() => {
      expect(saveEmailSettingsAction).toHaveBeenCalledTimes(1);
    });

    expect(saveEmailSettingsAction).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_email: "novo@bunkyo.org.br",
        cc_email: mockInitialSettings.cc_email,
        bcc_email: mockInitialSettings.bcc_email,
        subject_prefix: mockInitialSettings.subject_prefix,
        default_event_description:
          mockInitialSettings.default_event_description,
        greeting_text: mockInitialSettings.greeting_text,
        intro_text_template: mockInitialSettings.intro_text_template,
        spreadsheet_text: mockInitialSettings.spreadsheet_text,
        approver_email: mockInitialSettings.approver_email,
        approval_request_text: mockInitialSettings.approval_request_text,
        closing_text: mockInitialSettings.closing_text,
        sender_name: "Pedro Yamamoto",
        sender_role: mockInitialSettings.sender_role,
        sender_email: mockInitialSettings.sender_email,
        sender_phone: mockInitialSettings.sender_phone,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/sucesso|configurações salvas/i),
      ).toBeInTheDocument();
    });
  });

  it("should show error feedback when saveEmailSettingsAction returns { success: false, error }", async () => {
    vi.mocked(saveEmailSettingsAction).mockResolvedValueOnce({
      success: false,
      error: "Erro ao salvar configurações no banco",
    });

    render(<EmailSettingsForm initialSettings={mockInitialSettings} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Salvar Configurações/i }),
    );

    await waitFor(() => {
      expect(saveEmailSettingsAction).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Erro ao salvar configurações no banco/i),
      ).toBeInTheDocument();
    });
  });

  it("should restore all fields and preview to DEFAULT_EMAIL_SETTINGS when 'Restaurar Padrões CJB' is clicked", () => {
    render(<EmailSettingsForm initialSettings={mockInitialSettings} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Restaurar Padrões CJB/i }),
    );

    expect(screen.getByLabelText(/Para\s*\/\s*Destinatário/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.recipient_email,
    );
    expect(screen.getByLabelText(/^Cc\b/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.cc_email,
    );
    expect(screen.getByLabelText(/^Cco\b/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.bcc_email,
    );
    expect(screen.getByLabelText(/Padrão de Assunto/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.subject_prefix,
    );
    expect(screen.getByLabelText(/Descrição Padrão do Evento/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.default_event_description,
    );
    expect(screen.getByLabelText(/Saudação/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.greeting_text,
    );
    expect(screen.getByLabelText(/Texto Introdutório/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.intro_text_template,
    );
    expect(screen.getByLabelText(/Texto da Planilha/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.spreadsheet_text,
    );
    expect(screen.getByLabelText(/E-mail de Aprovação/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.approver_email,
    );
    expect(screen.getByLabelText(/Texto de Aprovação/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.approval_request_text,
    );
    expect(screen.getByLabelText(/Despedida/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.closing_text,
    );
    expect(screen.getByLabelText(/^Nome\b/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.sender_name,
    );
    expect(screen.getByLabelText(/^Cargo\b/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.sender_role,
    );
    expect(screen.getByLabelText(/E-mail na Assinatura/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.sender_email,
    );
    expect(screen.getByLabelText(/^Telefone\b/i)).toHaveValue(
      DEFAULT_EMAIL_SETTINGS.sender_phone,
    );

    expect(
      screen.getByText(DEFAULT_EMAIL_SETTINGS.greeting_text),
    ).toBeInTheDocument();
    expect(
      screen.getByText(DEFAULT_EMAIL_SETTINGS.sender_name),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`@${DEFAULT_EMAIL_SETTINGS.approver_email}`, "i"),
      ),
    ).toBeInTheDocument();
  });
});
