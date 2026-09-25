import type { Meta, StoryObj } from "@storybook/react";
import { AdminLoginForm } from "./admin-login-form";

const meta = {
  title: "Forms/AdminLoginForm",
  component: AdminLoginForm,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    onSubmit: { action: "submitted" },
  },
} satisfies Meta<typeof AdminLoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
