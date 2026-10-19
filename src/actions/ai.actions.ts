"use server";

import { revalidatePath } from "next/cache";
import type { RefundRequest } from "@/repositories/refund.repository";
import { RefundService } from "@/services/refund.service";

export async function processReceiptAction(
  requestId: string,
): Promise<{ success: boolean; data?: RefundRequest; error?: string }> {
  try {
    const refundService = new RefundService();
    const data = await refundService.approveAndProcessReceipt(requestId);
    revalidatePath("/admin");
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
