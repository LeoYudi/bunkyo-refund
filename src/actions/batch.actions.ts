"use server";

import type { RefundRequest } from "@/models/refund.model";

export async function sendBatchPaymentEmailAction(
  _requestIds: string[],
  _recipientEmail?: string,
): Promise<{
  success: boolean;
  data?: RefundRequest[];
  error?: string;
}> {
  return { success: false, error: "Not implemented" };
}

export async function exportToCsvAction(_requestIds: string[]): Promise<{
  success: boolean;
  csv?: string;
  error?: string;
}> {
  return { success: false, error: "Not implemented" };
}
