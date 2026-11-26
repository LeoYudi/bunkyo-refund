"use client";

import type {
  EmailSettings,
  EmailSettingsInput,
} from "@/models/settings.model";

export interface EmailPreviewCardProps {
  settings: Partial<EmailSettingsInput> | EmailSettings;
}

export function EmailPreviewCard(_props: EmailPreviewCardProps) {
  return <div data-testid="email-preview-card">Not implemented</div>;
}
