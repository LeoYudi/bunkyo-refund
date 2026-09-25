import type { Meta, StoryObj } from "@storybook/react";
import SubmitPage from "./page";

const meta = {
  title: "Pages/SubmitRefundPage",
  component: SubmitPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SubmitPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
