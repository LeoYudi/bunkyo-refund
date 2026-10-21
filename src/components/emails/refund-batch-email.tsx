import { Body, Container, Head, Html, Text } from "@react-email/components";
import type { RefundRequest } from "@/models/refund.model";

export interface RefundBatchEmailProps {
  date: string;
  requests?: RefundRequest[];
  totalValue?: number;
}

export function RefundBatchEmail({
  date,
  totalValue = 0,
}: RefundBatchEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Pedido de Reembolsos - {date}</Text>
          <Text>Total: {totalValue}</Text>
        </Container>
      </Body>
    </Html>
  );
}
