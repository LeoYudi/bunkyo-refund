import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
  type EmailSettingsInput,
} from "@/models/settings.model";
import { EmailPreviewCard } from "./email-preview-card";

const fullMockSettings: EmailSettings = {
  id: "settings-1",
  recipient_email: "financeiro@bunkyo.org.br",
  cc_email: "gestor@bunkyo.org.br",
  bcc_email: "diretoria@bunkyo.org.br",
  subject_prefix: "Reembolso CJB - ",
  default_event_description: "gastos com baiten do DFI 2026",
  greeting_text: "Pessoal, bom dia.",
  intro_text_template:
    "Gostaria de solicitar o reembolso referente aos {eventDescription}.",
  spreadsheet_text:
    'A planilha compartilhada "Solicitação de Reembolso de Despesas" foi preenchida com os valores e informações das notas que competem ao evento.',
  approver_email: "jaque.hanaoka@gmail.com",
  approval_request_text:
    "Por gentileza, poderia revisar e aprovar esta solicitação?",
  closing_text: "Atenciosamente,",
  sender_name: "Lucas Tamanaha",
  sender_role:
    "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
  sender_email: "jovens@bunkyo.org.br",
  sender_phone: "(16) 99332-8607",
  updated_at: "2026-11-26T10:00:00Z",
};

describe("EmailPreviewCard", () => {
  it("should render email headers (Para, Cc, Cco, Assunto) using configured values", () => {
    render(<EmailPreviewCard settings={fullMockSettings} />);

    expect(screen.getByText(/^Para\b/i)).toBeInTheDocument();
    expect(screen.getByText(/financeiro@bunkyo\.org\.br/i)).toBeInTheDocument();

    expect(screen.getByText(/^Cc\b/i)).toBeInTheDocument();
    expect(screen.getByText(/gestor@bunkyo\.org\.br/i)).toBeInTheDocument();

    expect(screen.getByText(/^Cco\b/i)).toBeInTheDocument();
    expect(screen.getByText(/diretoria@bunkyo\.org\.br/i)).toBeInTheDocument();

    expect(screen.getByText(/^Assunto\b/i)).toBeInTheDocument();
    expect(screen.getByText(/Reembolso CJB -/i)).toBeInTheDocument();
  });

  it("should render greeting, intro text with {eventDescription} replaced by default_event_description, and spreadsheet text", () => {
    render(<EmailPreviewCard settings={fullMockSettings} />);

    expect(screen.getByText("Pessoal, bom dia.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Gostaria de solicitar o reembolso referente aos gastos com baiten do DFI 2026.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'A planilha compartilhada "Solicitação de Reembolso de Despesas" foi preenchida com os valores e informações das notas que competem ao evento.',
      ),
    ).toBeInTheDocument();
  });

  it("should replace {eventDescription} with an example text when default_event_description is empty", () => {
    const settingsWithoutDesc: Partial<EmailSettingsInput> = {
      ...DEFAULT_EMAIL_SETTINGS,
      default_event_description: "",
      intro_text_template:
        "Solicito reembolso referente aos {eventDescription}.",
    };

    render(<EmailPreviewCard settings={settingsWithoutDesc} />);

    expect(screen.queryByText(/\{eventDescription\}/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Solicito reembolso referente aos .+\./i),
    ).toBeInTheDocument();
  });

  it("should render the sample table with headers 'Pessoa', 'PIX', 'Valor', fictitious rows, and 'Valor total'", () => {
    render(<EmailPreviewCard settings={fullMockSettings} />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    expect(within(table).getByText("Pessoa")).toBeInTheDocument();
    expect(within(table).getByText("PIX")).toBeInTheDocument();
    expect(within(table).getByText("Valor")).toBeInTheDocument();

    const rowgroups = within(table).getAllByRole("rowgroup");
    const tbody = rowgroups[1] ?? table;
    const bodyRows = within(tbody).getAllByRole("row");
    expect(bodyRows.length).toBeGreaterThanOrEqual(1);
    expect(within(tbody).getAllByText(/R\$\s*[\d.,]+/).length).toBeGreaterThan(
      0,
    );

    expect(screen.getByText(/Valor total/i)).toBeInTheDocument();
  });

  it("should render approver mention (@email), approval_request_text, closing_text, and signature fields", () => {
    render(<EmailPreviewCard settings={fullMockSettings} />);

    expect(screen.getByText(/@jaque\.hanaoka@gmail\.com/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Por gentileza, poderia revisar e aprovar esta solicitação\?/i,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Atenciosamente,")).toBeInTheDocument();
    expect(screen.getByText("Lucas Tamanaha")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("jovens@bunkyo.org.br")).toBeInTheDocument();
    expect(screen.getByText("(16) 99332-8607")).toBeInTheDocument();
  });

  it("should update preview in real time when rerendered with new settings values", () => {
    const { rerender } = render(
      <EmailPreviewCard settings={fullMockSettings} />,
    );

    const updatedSettings: EmailSettings = {
      ...fullMockSettings,
      recipient_email: "novo-financeiro@bunkyo.org.br",
      cc_email: "novo-cc@bunkyo.org.br",
      bcc_email: "novo-cco@bunkyo.org.br",
      subject_prefix: "Reembolso Especial - ",
      default_event_description: "gastos do Bon Odori 2026",
      greeting_text: "Boa tarde a todos,",
      intro_text_template: "Encaminho solicitação de {eventDescription}.",
      spreadsheet_text: "Planilha conferida e anexada.",
      approver_email: "aprovador.novo@bunkyo.org.br",
      approval_request_text: "Aprovar assim que possível.",
      closing_text: "Obrigado,",
      sender_name: "Kenji Sato",
      sender_role: "Tesoureiro CJB",
      sender_email: "tesouraria@bunkyo.org.br",
      sender_phone: "(11) 97777-6666",
    };

    rerender(<EmailPreviewCard settings={updatedSettings} />);

    expect(
      screen.getByText(/novo-financeiro@bunkyo\.org\.br/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/novo-cc@bunkyo\.org\.br/i)).toBeInTheDocument();
    expect(screen.getByText(/novo-cco@bunkyo\.org\.br/i)).toBeInTheDocument();
    expect(screen.getByText(/Reembolso Especial -/i)).toBeInTheDocument();

    expect(screen.getByText("Boa tarde a todos,")).toBeInTheDocument();
    expect(
      screen.getByText("Encaminho solicitação de gastos do Bon Odori 2026."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Planilha conferida e anexada."),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/@aprovador\.novo@bunkyo\.org\.br/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Aprovar assim que possível\./i),
    ).toBeInTheDocument();

    expect(screen.getByText("Obrigado,")).toBeInTheDocument();
    expect(screen.getByText("Kenji Sato")).toBeInTheDocument();
    expect(screen.getByText("Tesoureiro CJB")).toBeInTheDocument();
    expect(screen.getByText("tesouraria@bunkyo.org.br")).toBeInTheDocument();
    expect(screen.getByText("(11) 97777-6666")).toBeInTheDocument();

    expect(screen.queryByText("Pessoal, bom dia.")).not.toBeInTheDocument();
    expect(screen.queryByText("Lucas Tamanaha")).not.toBeInTheDocument();
  });

  it("should gracefully handle partial settings falling back to CJB defaults", () => {
    render(
      <EmailPreviewCard settings={{ recipient_email: "fin@bunkyo.org.br" }} />,
    );

    expect(screen.getByText(/fin@bunkyo\.org\.br/i)).toBeInTheDocument();
    expect(
      screen.getByText(DEFAULT_EMAIL_SETTINGS.greeting_text),
    ).toBeInTheDocument();
    expect(
      screen.getByText(DEFAULT_EMAIL_SETTINGS.sender_name),
    ).toBeInTheDocument();
  });
});
