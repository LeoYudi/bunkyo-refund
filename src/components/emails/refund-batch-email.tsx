import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Section,
  Text,
} from "@react-email/components";
import type { RefundRequest } from "@/models/refund.model";
import { DEFAULT_EMAIL_SETTINGS } from "@/models/settings.model";

export interface RefundBatchEmailProps {
  date: string;
  requests?: RefundRequest[];
  totalValue?: number;
  eventDescription?: string;
  approverEmail?: string;
  pixByRequester?: Record<string, string>;
  senderName?: string;
  senderRole?: string;
  senderEmail?: string;
  senderPhone?: string;
  greetingText?: string;
  introTextTemplate?: string;
  spreadsheetText?: string;
  approvalRequestText?: string;
  closingText?: string;
}

export function RefundBatchEmail({
  date,
  requests = [],
  totalValue,
  eventDescription,
  approverEmail,
  pixByRequester,
  senderName,
  senderRole,
  senderEmail,
  senderPhone,
  greetingText,
  introTextTemplate,
  spreadsheetText,
  approvalRequestText,
  closingText,
}: RefundBatchEmailProps) {
  const computedTotal =
    totalValue ??
    requests.reduce((acc, req) => acc + (req.total_value ?? 0), 0);

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const groups: Array<{ name: string; total: number; pix: string }> = [];
  for (const req of requests) {
    const name = req.requester_name;
    const val = req.total_value ?? 0;
    const existing = groups.find((g) => g.name === name);
    if (existing) {
      existing.total += val;
    } else {
      const pix = pixByRequester?.[name] || "-";
      groups.push({ name, total: val, pix });
    }
  }

  const rawDesc =
    eventDescription !== undefined
      ? eventDescription
      : DEFAULT_EMAIL_SETTINGS.default_event_description;
  const finalDesc =
    rawDesc && rawDesc.trim() !== "" ? rawDesc : `gastos do lote de ${date}`;
  const cleanDesc = finalDesc.replace(/^aos\s+/i, "");

  const resolvedGreeting =
    greetingText !== undefined && greetingText.trim() !== ""
      ? greetingText
      : DEFAULT_EMAIL_SETTINGS.greeting_text;
  const rawIntroTemplate =
    introTextTemplate !== undefined && introTextTemplate.trim() !== ""
      ? introTextTemplate
      : DEFAULT_EMAIL_SETTINGS.intro_text_template;
  const resolvedIntro = rawIntroTemplate.replaceAll(
    "{eventDescription}",
    cleanDesc,
  );
  const resolvedSpreadsheet =
    spreadsheetText !== undefined && spreadsheetText.trim() !== ""
      ? spreadsheetText
      : DEFAULT_EMAIL_SETTINGS.spreadsheet_text;
  const resolvedApprover =
    approverEmail !== undefined && approverEmail.trim() !== ""
      ? approverEmail
      : DEFAULT_EMAIL_SETTINGS.approver_email;
  const resolvedApprovalReq =
    approvalRequestText !== undefined && approvalRequestText.trim() !== ""
      ? approvalRequestText
      : DEFAULT_EMAIL_SETTINGS.approval_request_text;
  const resolvedClosing =
    closingText !== undefined && closingText.trim() !== ""
      ? closingText
      : DEFAULT_EMAIL_SETTINGS.closing_text;

  const resolvedSenderName =
    senderName !== undefined && senderName.trim() !== ""
      ? senderName
      : DEFAULT_EMAIL_SETTINGS.sender_name;
  const resolvedSenderRole =
    senderRole !== undefined && senderRole.trim() !== ""
      ? senderRole
      : DEFAULT_EMAIL_SETTINGS.sender_role;
  const resolvedSenderEmail =
    senderEmail !== undefined && senderEmail.trim() !== ""
      ? senderEmail
      : DEFAULT_EMAIL_SETTINGS.sender_email;
  const resolvedSenderPhone =
    senderPhone !== undefined && senderPhone.trim() !== ""
      ? senderPhone
      : DEFAULT_EMAIL_SETTINGS.sender_phone;

  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: "sans-serif",
          backgroundColor: "#f6f9fc",
          padding: "20px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "5px",
          }}
        >
          <Text>{resolvedGreeting}</Text>
          <Text>{resolvedIntro}</Text>
          <Text>{resolvedSpreadsheet}</Text>

          <Section style={{ margin: "20px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "8px" }}>Pessoa</th>
                  <th style={{ padding: "8px" }}>PIX</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr
                    key={group.name}
                    style={{ borderBottom: "1px solid #edf2f7" }}
                  >
                    <td style={{ padding: "8px" }}>{group.name}</td>
                    <td style={{ padding: "8px" }}>{group.pix}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      {currencyFormatter.format(group.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Text style={{ fontWeight: "bold", fontSize: "16px" }}>
            Valor total {currencyFormatter.format(computedTotal)}
          </Text>

          <Text style={{ marginTop: "20px" }}>
            @{resolvedApprover} {resolvedApprovalReq}
          </Text>

          <Text style={{ marginTop: "20px" }}>{resolvedClosing}</Text>
          <Text>
            <strong>{resolvedSenderName}</strong>
          </Text>
          <Text>{resolvedSenderRole}</Text>
          <Text>
            <Link
              href={`mailto:${resolvedSenderEmail}`}
              style={{ color: "#2563eb", textDecoration: "underline" }}
            >
              {resolvedSenderEmail}
            </Link>
          </Text>
          <Text>{resolvedSenderPhone}</Text>
        </Container>
      </Body>
    </Html>
  );
}
