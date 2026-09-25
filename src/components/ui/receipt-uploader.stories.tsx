import type { Meta, StoryObj } from "@storybook/react";
import { ReceiptUploader } from "./receipt-uploader";

const meta = {
  title: "UI/ReceiptUploader",
  component: ReceiptUploader,
  tags: ["autodocs"],
  argTypes: {
    onFileSelect: { action: "onFileSelect" },
  },
} satisfies Meta<typeof ReceiptUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
