import type { Meta, StoryObj } from "@storybook/react";
import { AdminHeader } from "./admin-header";

const meta = {
  title: "Layout/AdminHeader",
  component: AdminHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="flex flex-col bg-background min-h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
