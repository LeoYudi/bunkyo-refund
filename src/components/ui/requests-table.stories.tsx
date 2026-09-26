import type { Meta, StoryObj } from "@storybook/react";
import type { Database } from "@/models/database.types";
import { RequestsTable } from "./requests-table";

type RefundRequest = Database["public"]["Tables"]["refund_requests"]["Row"];

const meta = {
  title: "UI/RequestsTable",
  component: RequestsTable,
  tags: ["autodocs"],
} satisfies Meta<typeof RequestsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockRequests: RefundRequest[] = [
  {
    id: "1",
    requester_name: "Leonardo Higuti",
    status: "PENDING",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: "Almoço com cliente",
    issue_date: "2026-09-26",
    issue_number: "NF-1234",
    issuer_cnpj: "12.345.678/0001-90",
    issuer_name: "Restaurante Saboroso",
    receipt_file_url: "http://example.com/receipt1.pdf",
    receiver_cnpj: "98.765.432/0001-10",
    reviewed_by: null,
    total_value: 150.5,
  },
  {
    id: "2",
    requester_name: "Ana Silva",
    status: "APPROVED",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    description: "Uber para o aeroporto",
    issue_date: "2026-09-25",
    issue_number: "UBER-999",
    issuer_cnpj: "00.000.000/0001-00",
    issuer_name: "Uber",
    receipt_file_url: "http://example.com/receipt2.pdf",
    receiver_cnpj: "98.765.432/0001-10",
    reviewed_by: "user-1",
    total_value: 45.0,
  },
  {
    id: "3",
    requester_name: "Carlos Mendes",
    status: "DENIED",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    description: "Compra não autorizada",
    issue_date: "2026-09-24",
    issue_number: null,
    issuer_cnpj: null,
    issuer_name: null,
    receipt_file_url: "http://example.com/receipt3.pdf",
    receiver_cnpj: null,
    reviewed_by: "user-1",
    total_value: null,
  },
];

export const Default: Story = {
  args: {
    requests: mockRequests,
  },
};

export const Empty: Story = {
  args: {
    requests: [],
  },
};
