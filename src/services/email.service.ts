import { render } from "@react-email/components";
import { RefundBatchEmail } from "@/components/emails/refund-batch-email";
import { createClient } from "@/lib/supabase/server";
import type { RefundRequest } from "@/models/refund.model";

export interface SendBatchEmailParams {
  requests: RefundRequest[];
  recipientEmail?: string;
  cc?: string;
  bcc?: string;
  date: string;
}

export interface SendBatchEmailResult {
  messageId: string;
}

export async function sendBatchEmailWithGmail({
  requests,
  recipientEmail,
  date,
}: SendBatchEmailParams): Promise<SendBatchEmailResult> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const providerToken = sessionData?.session?.provider_token;
  const senderEmail = sessionData?.session?.user?.email;

  if (!providerToken) {
    throw new Error(
      "Token de acesso do Google (Gmail) não encontrado. Faça login novamente com sua conta Google.",
    );
  }

  const to = recipientEmail?.trim() || process.env.FINANCE_EMAIL || senderEmail;
  if (!to) {
    throw new Error("E-mail do destinatário não informado");
  }

  const attachments: Array<{
    filename: string;
    mimeType: string;
    base64: string;
  }> = [];

  for (const req of requests) {
    if (req.receipt_file_url) {
      let storagePath = req.receipt_file_url;
      if (storagePath.includes("/receipts/")) {
        const parts = storagePath.split("/receipts/");
        storagePath = parts[1].split("?")[0];
      } else {
        const urlObj = new URL(storagePath);
        const segments = urlObj.pathname.split("/");
        storagePath = segments[segments.length - 1];
      }

      const { data: fileBlob } = await supabase.storage
        .from("receipts")
        .download(storagePath);

      if (fileBlob) {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        attachments.push({
          filename: storagePath,
          mimeType: fileBlob.type || "application/octet-stream",
          base64,
        });
      }
    }
  }

  const htmlBody = await render(RefundBatchEmail({ date, requests }));
  const boundary = `batch_boundary_${Date.now()}`;

  let mimeMessage = "";
  mimeMessage += `From: ${senderEmail ?? "me"}\r\n`;
  mimeMessage += `To: ${to}\r\n`;
  const subjectEncoded = Buffer.from(`Pedido de Reembolsos - ${date}`).toString(
    "base64",
  );
  mimeMessage += `Subject: =?UTF-8?B?${subjectEncoded}?=\r\n`;
  mimeMessage += `MIME-Version: 1.0\r\n`;
  mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

  mimeMessage += `--${boundary}\r\n`;
  mimeMessage += `Content-Type: text/html; charset="UTF-8"\r\n`;
  mimeMessage += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
  mimeMessage += `${htmlBody}\r\n\r\n`;

  for (const att of attachments) {
    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n`;
    mimeMessage += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
    mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    mimeMessage += `${att.base64}\r\n\r\n`;
  }

  mimeMessage += `--${boundary}--\r\n`;

  const encodedMime = Buffer.from(mimeMessage).toString("base64url");

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMime }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Falha ao enviar e-mail via Gmail API (status ${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  return { messageId: data.id };
}
