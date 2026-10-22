import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import type { RefundRequest } from "@/models/refund.model";
import { sendBatchEmailWithGmail } from "./email.service";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("email.service - sendBatchEmailWithGmail", () => {
  const mockRequests: RefundRequest[] = [
    {
      id: "req-1",
      requester_name: "Alice Silva",
      status: "APPROVED",
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-20T10:00:00Z",
      description: "Almoço de equipe",
      issue_date: "2026-10-20",
      issue_number: "NF-101",
      issuer_cnpj: "12.345.678/0001-90",
      issuer_name: "Restaurante Sabor",
      receipt_file_url:
        "https://example.supabase.co/storage/v1/object/public/receipts/20261020-doc1.pdf",
      receiver_cnpj: "98.765.432/0001-10",
      reviewed_by: "admin-1",
      total_value: 150.5,
    },
  ];

  const mockDownload = vi.fn();
  const mockGetSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockDownload.mockResolvedValue({
      data: new Blob(["fake-pdf-content"], { type: "application/pdf" }),
      error: null,
    });

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          provider_token: "google-oauth-token-xyz",
          user: {
            email: "admin@bunkyo.org.br",
          },
        },
      },
      error: null,
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getSession: mockGetSession,
      },
      storage: {
        from: vi.fn().mockReturnValue({
          download: mockDownload,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ id: "gmail-msg-123" }),
      text: vi.fn().mockResolvedValue(""),
    } as unknown as Response);
  });

  it("should download attachments, build MIME message, and send email via Gmail API using session provider_token", async () => {
    const result = await sendBatchEmailWithGmail({
      requests: mockRequests,
      recipientEmail: "financeiro@bunkyo.org.br",
      date: "21/10/2026",
    });

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(mockDownload).toHaveBeenCalledWith("20261020-doc1.pdf");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer google-oauth-token-xyz",
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      }),
    );

    const fetchCallArgs = vi.mocked(global.fetch).mock.calls[0];
    const parsedBody = JSON.parse(fetchCallArgs[1]?.body as string) as {
      raw: string;
    };
    expect(parsedBody).toEqual({
      raw: expect.any(String),
    });

    const decodedMime = Buffer.from(parsedBody.raw, "base64url").toString(
      "utf-8",
    );
    expect(decodedMime).toContain("To: financeiro@bunkyo.org.br\r\n");
    expect(decodedMime).not.toContain("Cc:");
    expect(decodedMime).not.toContain("Bcc:");

    const expectedDefaultSubject = Buffer.from(
      "Reembolso CJB - 21/10/2026",
    ).toString("base64");
    expect(decodedMime).toContain(
      `Subject: =?UTF-8?B?${expectedDefaultSubject}?=\r\n`,
    );

    expect(result).toEqual({ messageId: "gmail-msg-123" });
  });

  it("should encode custom subject in the MIME Subject header when subject is provided", async () => {
    await sendBatchEmailWithGmail({
      requests: mockRequests,
      recipientEmail: "financeiro@bunkyo.org.br",
      date: "21/10/2026",
      subject: "Reembolso CJB - DFI 2026",
    });

    const fetchCallArgs = vi.mocked(global.fetch).mock.calls[0];
    const parsedBody = JSON.parse(fetchCallArgs[1]?.body as string) as {
      raw: string;
    };
    const decodedMime = Buffer.from(parsedBody.raw, "base64url").toString(
      "utf-8",
    );

    const expectedCustomSubject = Buffer.from(
      "Reembolso CJB - DFI 2026",
    ).toString("base64");
    expect(decodedMime).toContain(
      `Subject: =?UTF-8?B?${expectedCustomSubject}?=\r\n`,
    );
  });

  it("should include Cc and Bcc headers in the raw MIME message when cc and bcc are provided", async () => {
    await sendBatchEmailWithGmail({
      requests: mockRequests,
      recipientEmail: "financeiro@bunkyo.org.br",
      cc: "gestor@bunkyo.org.br, contabilidade@bunkyo.org.br",
      bcc: "diretoria@bunkyo.org.br",
      date: "21/10/2026",
    });

    const fetchCallArgs = vi.mocked(global.fetch).mock.calls[0];
    const parsedBody = JSON.parse(fetchCallArgs[1]?.body as string) as {
      raw: string;
    };
    const decodedMime = Buffer.from(parsedBody.raw, "base64url").toString(
      "utf-8",
    );

    expect(decodedMime).toContain(
      "Cc: gestor@bunkyo.org.br, contabilidade@bunkyo.org.br\r\n",
    );
    expect(decodedMime).toContain("Bcc: diretoria@bunkyo.org.br\r\n");
  });

  it("should not include Cc or Bcc headers when cc and bcc are blank strings", async () => {
    await sendBatchEmailWithGmail({
      requests: mockRequests,
      recipientEmail: "financeiro@bunkyo.org.br",
      cc: "   ",
      bcc: "",
      date: "21/10/2026",
    });

    const fetchCallArgs = vi.mocked(global.fetch).mock.calls[0];
    const parsedBody = JSON.parse(fetchCallArgs[1]?.body as string) as {
      raw: string;
    };
    const decodedMime = Buffer.from(parsedBody.raw, "base64url").toString(
      "utf-8",
    );

    expect(decodedMime).not.toContain("Cc:");
    expect(decodedMime).not.toContain("Bcc:");
  });

  it("should throw an error when session.provider_token is missing", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: {
        session: {
          provider_token: null,
          user: { email: "admin@bunkyo.org.br" },
        },
      },
      error: null,
    });

    await expect(
      sendBatchEmailWithGmail({
        requests: mockRequests,
        recipientEmail: "financeiro@bunkyo.org.br",
        date: "21/10/2026",
      }),
    ).rejects.toThrow(/token|google/i);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should throw an error when Gmail API responds with !response.ok", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ error: { message: "Forbidden" } }),
      text: vi.fn().mockResolvedValue("Forbidden"),
    } as unknown as Response);

    await expect(
      sendBatchEmailWithGmail({
        requests: mockRequests,
        recipientEmail: "financeiro@bunkyo.org.br",
        date: "21/10/2026",
      }),
    ).rejects.toThrow(/gmail|403|forbidden|falha/i);
  });
});
