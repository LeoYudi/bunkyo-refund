import type { Meta, StoryObj } from "@storybook/react";
import { SubmitRefundForm } from "./submit-refund-form";

const meta = {
  title: "Forms/SubmitRefundForm",
  component: SubmitRefundForm,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof SubmitRefundForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmitAction: async (formData) => {
      console.log(
        "Form submitted with:",
        Object.fromEntries(formData.entries()),
      );
      // Mock network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true };
    },
  },
};

export const WithServerError: Story = {
  args: {
    onSubmitAction: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        success: false,
        error:
          "Erro de conexão com o banco de dados. Tente novamente mais tarde.",
      };
    },
  },
};
