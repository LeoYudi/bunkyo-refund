import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ReceiptUploader } from "./receipt-uploader";

const meta = {
  title: "UI/ReceiptUploader",
  component: ReceiptUploader,
  tags: ["autodocs"],
  args: {
    onFileSelect: fn(),
  },
} satisfies Meta<typeof ReceiptUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedFile: null,
  },
};

export const WithSelectedImage: Story = {
  args: {
    selectedFile: new File([""], "comprovante-uber.jpg", {
      type: "image/jpeg",
    }),
  },
};

export const WithSelectedPDF: Story = {
  args: {
    selectedFile: new File([""], "nota-fiscal.pdf", {
      type: "application/pdf",
    }),
  },
};
