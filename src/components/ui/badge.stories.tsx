import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "pending",
        "processing",
        "approved",
        "denied",
        "sent",
        "paid",
      ],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
};

export const Pending: Story = {
  args: {
    children: "Pendente",
    variant: "pending",
  },
};

export const Processing: Story = {
  args: {
    children: "Processando",
    variant: "processing",
  },
};

export const Approved: Story = {
  args: {
    children: "Aprovado",
    variant: "approved",
  },
};

export const Denied: Story = {
  args: {
    children: "Negado",
    variant: "denied",
  },
};

export const Sent: Story = {
  args: {
    children: "Enviado",
    variant: "sent",
  },
};

export const Paid: Story = {
  args: {
    children: "Pago",
    variant: "paid",
  },
};
