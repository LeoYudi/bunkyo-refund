export const ALLOWED_ADMIN_DOMAINS = ["bunkyo.org.br"] as const;
export const ALLOWED_ADMIN_EMAILS = ["lyhiguti@gmail.com"] as const;

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized || /\s/.test(normalized)) {
    return false;
  }

  const parts = normalized.split("@");
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;
  if (!localPart || !domain) {
    return false;
  }

  if (
    ALLOWED_ADMIN_EMAILS.includes(
      normalized as (typeof ALLOWED_ADMIN_EMAILS)[number],
    )
  ) {
    return true;
  }

  return ALLOWED_ADMIN_DOMAINS.includes(
    domain as (typeof ALLOWED_ADMIN_DOMAINS)[number],
  );
}
