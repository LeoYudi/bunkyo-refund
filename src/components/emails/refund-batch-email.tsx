import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
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
}: RefundBatchEmailProps) {
  const computedTotal =
    totalValue ??
    requests.reduce((acc, req) => acc + (req.total_value ?? 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

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
          <Heading
            as="h1"
            style={{ fontSize: "20px", color: "#333", marginBottom: "20px" }}
          >
            Pedido de Reembolsos - {date}
          </Heading>
          <Section>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "20px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #eaeaea",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "10px" }}>Colaborador</th>
                  <th style={{ padding: "10px" }}>Valor</th>
                  <th style={{ padding: "10px" }}>CNPJ</th>
                  <th style={{ padding: "10px" }}>Link do Comprovante</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    style={{ borderBottom: "1px solid #f0f0f0" }}
                  >
                    <td style={{ padding: "10px" }}>{req.requester_name}</td>
                    <td style={{ padding: "10px" }}>
                      {formatCurrency(req.total_value ?? 0)}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {req.issuer_cnpj || "-"}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {req.receipt_file_url ? (
                        <Link
                          href={req.receipt_file_url}
                          style={{
                            color: "#007bff",
                            textDecoration: "underline",
                          }}
                        >
                          Ver Comprovante
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Hr style={{ borderColor: "#eaea", margin: "20px 0" }} />
          <Section>
            <Text
              style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}
            >
              Valor Total Geral: {formatCurrency(computedTotal)}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
