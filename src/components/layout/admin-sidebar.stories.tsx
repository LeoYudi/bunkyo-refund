import type { Meta, StoryObj } from "@storybook/react";
import { AdminSidebar } from "./admin-sidebar";

const meta = {
  title: "Layout/AdminSidebar",
  component: AdminSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="flex bg-background min-h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
