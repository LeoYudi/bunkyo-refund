"use server";

import type { RefundRequest } from "@/repositories/refund.repository";

export async function processReceiptAction(
  _requestId: string,
): Promise<{ success: boolean; data?: RefundRequest; error?: string }> {
  throw new Error("Method not implemented.");
}
