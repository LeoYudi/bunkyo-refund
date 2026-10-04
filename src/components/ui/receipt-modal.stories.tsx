import type { Meta, StoryObj } from "@storybook/react";
import { ReceiptModal } from "./receipt-modal";

const meta = {
  title: "UI/ReceiptModal",
  component: ReceiptModal,
  tags: ["autodocs"],
  argTypes: {
    onClose: { action: "onClose" },
    onDownload: { action: "onDownload" },
  },
} satisfies Meta<typeof ReceiptModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClose: () => {},
    isOpen: true,
    receiptUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
};

export const ImageReceipt: Story = {
  args: {
    onClose: () => {},
    isOpen: true,
    receiptUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
  },
};

export const Closed: Story = {
  args: {
    onClose: () => {},
    isOpen: false,
    receiptUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
};

export const WithoutUrl: Story = {
  args: {
    onClose: () => {},
    isOpen: true,
    receiptUrl: null,
  },
};
