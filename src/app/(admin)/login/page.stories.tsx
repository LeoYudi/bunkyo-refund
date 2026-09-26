import type { Meta, StoryObj } from "@storybook/react";
import AdminLoginPage from "./page";

const meta = {
  title: "Pages/AdminLoginPage",
  component: AdminLoginPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof AdminLoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
