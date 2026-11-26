import type { Meta, StoryObj } from "@storybook/react";
import type { RefundRequest } from "@/models/refund.model";
import { DeleteRefundDialog } from "./delete-refund-dialog";

const meta: Meta<typeof DeleteRefundDialog> = {
  title: "UI/DeleteRefundDialog",
  component: DeleteRefundDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DeleteRefundDialog>;

const mockRequest: RefundRequest = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  requester_name: "Carlos Silva",
  status: "PENDING",
  total_value: 150.5,
  issuer_name: "Papelaria Central",
  issuer_cnpj: "12.345.678/0001-90",
  receiver_cnpj: "98.765.432/0001-10",
  issue_date: "2026-10-15",
  issue_number: "NF-9988",
  description: "Material de escritório",
  receipt_file_url: "https://example.com/receipt.pdf",
  created_at: new Date("2026-10-15T10:00:00Z").toISOString(),
  updated_at: new Date("2026-10-15T10:00:00Z").toISOString(),
  reviewed_by: null,
};

export const Pending: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    request: mockRequest,
  },
};

export const Sent: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    request: { ...mockRequest, status: "SENT" },
  },
};

export const Paid: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    request: { ...mockRequest, status: "PAID" },
  },
};
