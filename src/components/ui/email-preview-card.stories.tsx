import type { Meta, StoryObj } from "@storybook/react";
import { DEFAULT_EMAIL_SETTINGS } from "@/models/settings.model";
import { EmailPreviewCard } from "./email-preview-card";

const meta: Meta<typeof EmailPreviewCard> = {
  title: "UI/EmailPreviewCard",
  component: EmailPreviewCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmailPreviewCard>;

export const Default: Story = {
  args: {
    settings: DEFAULT_EMAIL_SETTINGS,
  },
};

export const CustomEvent: Story = {
  args: {
    settings: {
      ...DEFAULT_EMAIL_SETTINGS,
      recipient_email: "financeiro@bunkyo.org.br",
      cc_email: "diretoria@bunkyo.org.br",
      subject_prefix: "Reembolso Festival - ",
      default_event_description: "gastos do Haru Matsuri 2026",
      approver_email: "presidente@bunkyo.org.br",
      sender_name: "Kenji Takahashi",
      sender_role: "Tesoureiro CJB - Gestão 2026",
    },
  },
};
