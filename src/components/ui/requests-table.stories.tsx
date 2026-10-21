import type { Meta, StoryObj } from "@storybook/react";
import type { RefundRequest } from "@/models/refund.model";
import { RequestsTable } from "./requests-table";
import { StatusLifecycle } from "./status-lifecycle";

const meta = {
  title: "UI/RequestsTable",
  component: RequestsTable,
  tags: ["autodocs"],
  argTypes: {
    onProcessRequest: { action: "onProcessRequest" },
    onProcessBatch: { action: "onProcessBatch" },
    onConfirmBatch: { action: "onConfirmBatch" },
  },
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
    status: "PROCESSING",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    description: "Material de escritório",
    issue_date: "2026-09-25",
    issue_number: "NF-5678",
    issuer_cnpj: "11.222.333/0001-44",
    issuer_name: "Papelaria Central",
    receipt_file_url: "http://example.com/receipt2.pdf",
    receiver_cnpj: "98.765.432/0001-10",
    reviewed_by: null,
    total_value: 89.9,
  },
  {
    id: "3",
    requester_name: "Mariana Costa",
    status: "APPROVED",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    description: "Uber para o aeroporto",
    issue_date: "2026-09-25",
    issue_number: "UBER-999",
    issuer_cnpj: "00.000.000/0001-00",
    issuer_name: "Uber",
    receipt_file_url: "http://example.com/receipt3.pdf",
    receiver_cnpj: "98.765.432/0001-10",
    reviewed_by: "user-1",
    total_value: 45.0,
  },
  {
    id: "4",
    requester_name: "Carlos Mendes",
    status: "DENIED",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    description: "Compra não autorizada",
    issue_date: "2026-09-24",
    issue_number: null,
    issuer_cnpj: null,
    issuer_name: null,
    receipt_file_url: "http://example.com/receipt4.pdf",
    receiver_cnpj: null,
    reviewed_by: "user-1",
    total_value: null,
  },
  {
    id: "5",
    requester_name: "Beatriz Lima",
    status: "SENT",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    description: "Envio de documentos para contabilidade",
    issue_date: "2026-09-23",
    issue_number: null,
    issuer_cnpj: null,
    issuer_name: null,
    receipt_file_url: "http://example.com/receipt5.pdf",
    receiver_cnpj: null,
    reviewed_by: "user-1",
    total_value: 120.0,
  },
  {
    id: "6",
    requester_name: "Roberto Dias",
    status: "PAID",
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
    description: "Manutenção de equipamentos",
    issue_date: "2026-09-22",
    issue_number: "NF-9988",
    issuer_cnpj: "33.444.555/0001-66",
    issuer_name: "Tech Solutions",
    receipt_file_url: "http://example.com/receipt6.pdf",
    receiver_cnpj: "98.765.432/0001-10",
    reviewed_by: "user-1",
    total_value: 350.0,
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

export const WithStatusLifecycle: Story = {
  render: (args) => (
    <div className="space-y-6">
      <StatusLifecycle />
      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <RequestsTable {...args} />
      </div>
    </div>
  ),
  args: {
    requests: mockRequests,
  },
};
