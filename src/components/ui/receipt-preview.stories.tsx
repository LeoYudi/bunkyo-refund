import type { Meta, StoryObj } from "@storybook/react";
import { ReceiptPreview } from "./receipt-preview";

const meta = {
  title: "UI/ReceiptPreview",
  component: ReceiptPreview,
  tags: ["autodocs"],
  argTypes: {
    onConfirm: { action: "onConfirm" },
    onCancel: { action: "onCancel" },
  },
} satisfies Meta<typeof ReceiptPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create a dummy image file
const dummyImageFile = new File([""], "nota_fiscal.png", { type: "image/png" });
// Mock createObjectURL for storybook
URL.createObjectURL = () =>
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80";

export const ImagePreview: Story = {
  args: {
    file: dummyImageFile,
  },
};

const dummyPdfFile = new File([""], "comprovante_uber.pdf", {
  type: "application/pdf",
});

export const PdfPreview: Story = {
  args: {
    file: dummyPdfFile,
  },
};
