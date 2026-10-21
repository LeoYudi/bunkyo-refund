import type { RefundRequest } from "@/models/refund.model";

export interface SendBatchEmailParams {
  requests: RefundRequest[];
  recipientEmail?: string;
  date: string;
}

export async function sendBatchEmailWithGmail(
  _params: SendBatchEmailParams,
): Promise<{ messageId: string }> {
  throw new Error("Not implemented");
}
