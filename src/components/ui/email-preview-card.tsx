import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
} from "@/models/settings.model";

export interface EmailPreviewCardProps {
  settings?: Partial<EmailSettings>;
}

export function EmailPreviewCard({ settings = {} }: EmailPreviewCardProps) {
  const merged = { ...DEFAULT_EMAIL_SETTINGS, ...settings };

  const rawDesc =
    merged.default_event_description?.trim() || "gastos do evento";
  const cleanDesc = rawDesc.replace(/^aos\s+/i, "");
  const resolvedIntro = (
    merged.intro_text_template || DEFAULT_EMAIL_SETTINGS.intro_text_template
  ).replaceAll("{eventDescription}", cleanDesc);

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div
      data-testid="email-preview-card"
      className="border rounded-lg p-6 bg-white shadow-sm space-y-4 text-sm text-slate-700"
    >
      <div className="border-b pb-3 space-y-1 text-xs text-slate-500">
        <div>
          <span className="font-semibold text-slate-900">Para:</span>{" "}
          {merged.recipient_email || "(vazio)"}
        </div>
        {merged.cc_email && (
          <div>
            <span className="font-semibold text-slate-900">Cc:</span>{" "}
            {merged.cc_email}
          </div>
        )}
        {merged.bcc_email && (
          <div>
            <span className="font-semibold text-slate-900">Cco:</span>{" "}
            {merged.bcc_email}
          </div>
        )}
        <div>
          <span className="font-semibold text-slate-900">Assunto:</span>{" "}
          {merged.subject_prefix}27/09/2026
        </div>
      </div>

      <div className="space-y-3">
        <p>{merged.greeting_text}</p>
        <p>{resolvedIntro}</p>
        <p>{merged.spreadsheet_text}</p>

        <div className="border rounded my-4 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="p-2">Pessoa</th>
                <th className="p-2">PIX</th>
                <th className="p-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              <tr>
                <td className="p-2">Yago Soares Fernandes</td>
                <td className="p-2">13988770722</td>
                <td className="p-2 text-right">
                  {currencyFormatter.format(217.8)}
                </td>
              </tr>
              <tr>
                <td className="p-2">Lucas Tamanaha Cardoso</td>
                <td className="p-2">outra-chave@bunkyo.org.br</td>
                <td className="p-2 text-right">
                  {currencyFormatter.format(213.9)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="font-bold text-base text-slate-900">
          Valor total {currencyFormatter.format(431.7)}
        </p>

        <p>
          @{merged.approver_email} {merged.approval_request_text}
        </p>

        <div className="pt-2 text-slate-800">
          <p>{merged.closing_text}</p>
          <p className="font-bold text-slate-900 mt-1">{merged.sender_name}</p>
          <p>{merged.sender_role}</p>
          <p>
            <a
              href={`mailto:${merged.sender_email}`}
              className="text-blue-600 underline"
            >
              {merged.sender_email}
            </a>
          </p>
          <p>{merged.sender_phone}</p>
        </div>
      </div>
    </div>
  );
}
