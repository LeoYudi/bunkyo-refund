import * as React from "react";
import { Html, Head, Body, Container, Text } from "@react-email/components";

export function RefundBatchEmail({ date, totalValue }: { date: string, totalValue: number }) {
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
