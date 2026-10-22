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
}: RefundBatchEmailProps) {
  const computedTotal =
    totalValue ??
    requests.reduce((acc, req) => acc + (req.total_value ?? 0), 0);

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Group requests by requester_name keeping order of appearance
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

  const rawDesc = eventDescription?.trim() || `gastos do lote de ${date}`;
  const cleanDesc = rawDesc.replace(/^aos\s+/i, "");

  const resolvedApprover = approverEmail?.trim() || "jaque.hanaoka@gmail.com";
  const resolvedSenderName = senderName?.trim() || "Lucas Tamanaha";
  const resolvedSenderRole =
    senderRole?.trim() ||
    "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026";
  const resolvedSenderEmail = senderEmail?.trim() || "jovens@bunkyo.org.br";
  const resolvedSenderPhone = senderPhone?.trim() || "(16) 99332-8607";

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
          <Text>Pessoal, bom dia.</Text>
          <Text>
            Gostaria de solicitar o reembolso referente aos {cleanDesc}.
          </Text>
          <Text>
            A planilha compartilhada "Solicitação de Reembolso de Despesas" foi
            preenchida com os valores e informações das notas que competem ao
            evento.
          </Text>

          <Section>
            <table
              style={{
                borderCollapse: "collapse",
                marginTop: "16px",
                marginBottom: "4px",
                width: "100%",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#d9d9d9" }}>
                  <th
                    style={{
                      border: "1px solid #000000",
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    Pessoa
                  </th>
                  <th
                    style={{
                      border: "1px solid #000000",
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    PIX
                  </th>
                  <th
                    style={{
                      border: "1px solid #000000",
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.name}>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "8px",
                      }}
                    >
                      {group.name}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "8px",
                      }}
                    >
                      {group.pix}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "8px",
                      }}
                    >
                      {currencyFormatter.format(group.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Text style={{ fontWeight: "bold" }}>
            Valor total {currencyFormatter.format(computedTotal)}
          </Text>

          <Text>
            <Link
              href={`mailto:${resolvedApprover}`}
              style={{ color: "#1155cc" }}
            >
              @{resolvedApprover}
            </Link>
            <span>
              . Por gentileza, poderia revisar e aprovar esta solicitação?
            </span>
          </Text>

          <Text>Atenciosamente,</Text>
          <Text style={{ color: "#cc0000", fontWeight: "bold", margin: "0" }}>
            {resolvedSenderName}
          </Text>
          <Text style={{ fontWeight: "bold", margin: "0" }}>
            {resolvedSenderRole}
          </Text>
          <Text style={{ color: "#cc0000", margin: "0" }}>
            {resolvedSenderEmail}
          </Text>
          <Text style={{ color: "#cc0000", fontWeight: "bold", margin: "0" }}>
            {resolvedSenderPhone}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
