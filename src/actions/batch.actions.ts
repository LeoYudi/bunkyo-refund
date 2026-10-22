"use server";

import { revalidatePath } from "next/cache";
import type { RefundRequest } from "@/models/refund.model";
import type { BatchEmailMetadata } from "@/services/email.service";
import { RefundService } from "@/services/refund.service";

export async function sendBatchPaymentEmailAction(
  requestIds: string[],
  recipientEmail?: string,
  cc?: string,
  bcc?: string,
  metadata?: BatchEmailMetadata,
): Promise<{
  success: boolean;
  data?: RefundRequest[];
  error?: string;
}> {
  if (!requestIds || requestIds.length === 0) {
    return { success: false, error: "Nenhuma solicitação selecionada" };
  }

  try {
    const refundService = new RefundService();
    const data = await refundService.sendBatchPayment(
      requestIds,
      recipientEmail,
      cc,
      bcc,
      metadata,
    );
    revalidatePath("/admin");
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function exportToCsvAction(requestIds: string[]): Promise<{
  success: boolean;
  csv?: string;
  error?: string;
}> {
  if (!requestIds || requestIds.length === 0) {
    return { success: false, error: "Nenhuma solicitação selecionada" };
  }

  try {
    const refundService = new RefundService();
    const csv = await refundService.exportRequestsToCsv(requestIds);
    return { success: true, csv };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
