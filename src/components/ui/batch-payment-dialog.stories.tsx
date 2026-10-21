import type { Meta, StoryObj } from "@storybook/react";
import type { RefundRequest } from "@/models/refund.model";
import { BatchPaymentDialog } from "./batch-payment-dialog";

const mockRequests: RefundRequest[] = [
  {
    id: "req-1",
    requester_name: "Alice Silva",
    status: "APPROVED",
    created_at: new Date("2026-09-25T10:00:00Z").toISOString(),
    updated_at: new Date("2026-09-25T10:00:00Z").toISOString(),
    description: "Almoço da equipe",
    issue_date: "2026-09-25",
    issue_number: "NF-100",
    issuer_cnpj: "12.345.678/0001-90",
    issuer_name: "Restaurante Sabor",
    receipt_file_url: "https://example.com/receipt1.pdf",
    receiver_cnpj: null,
    reviewed_by: "admin-1",
    total_value: 150.5,
  },
  {
    id: "req-2",
    requester_name: "Bob Santos",
    status: "APPROVED",
    created_at: new Date("2026-09-26T10:00:00Z").toISOString(),
    updated_at: new Date("2026-09-26T10:00:00Z").toISOString(),
    description: "Transporte evento",
    issue_date: "2026-09-26",
    issue_number: "NF-101",
    issuer_cnpj: "98.765.432/0001-10",
    issuer_name: "Fretamento Express",
    receipt_file_url: "https://example.com/receipt2.pdf",
    receiver_cnpj: null,
    reviewed_by: "admin-1",
    total_value: 450.0,
  },
];

const meta: Meta<typeof BatchPaymentDialog> = {
  title: "UI/BatchPaymentDialog",
  component: BatchPaymentDialog,
  tags: ["autodocs"],
  argTypes: {
    onClose: { action: "onClose" },
    onConfirm: { action: "onConfirm" },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof BatchPaymentDialog>;

export const Default: Story = {
  args: {
    isOpen: true,
    selectedRequests: mockRequests,
  },
};

export const SingleRequest: Story = {
  args: {
    isOpen: true,
    selectedRequests: [mockRequests[0]],
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    selectedRequests: mockRequests,
  },
};
