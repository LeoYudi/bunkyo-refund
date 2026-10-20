import type { Meta, StoryObj } from "@storybook/react";
import { StatusLifecycle } from "./status-lifecycle";

const meta = {
  title: "UI/StatusLifecycle",
  component: StatusLifecycle,
  tags: ["autodocs"],
} satisfies Meta<typeof StatusLifecycle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
