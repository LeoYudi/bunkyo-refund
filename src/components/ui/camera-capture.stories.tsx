import type { Meta, StoryObj } from "@storybook/react";
import { CameraCapture } from "./camera-capture";

const meta = {
  title: "UI/CameraCapture",
  component: CameraCapture,
  tags: ["autodocs"],
  argTypes: {
    onCapture: { action: "onCapture" },
  },
} satisfies Meta<typeof CameraCapture>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
