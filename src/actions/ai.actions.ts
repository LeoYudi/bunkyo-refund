"use server";

import { revalidatePath } from "next/cache";
import type { RefundRequest } from "@/models/refund.model";
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

export async function processBatchReceiptsAction(
  requestIds: string[],
): Promise<{
  success: boolean;
  data?: {
    succeeded: RefundRequest[];
    failed: Array<{ id: string; error: string }>;
  };
  error?: string;
}> {
  if (!requestIds || requestIds.length === 0) {
    return { success: false, error: "Nenhuma solicitação selecionada" };
  }

  try {
    const refundService = new RefundService();
    const data = await refundService.approveAndProcessBatchReceipts(requestIds);
    revalidatePath("/admin");

    if (data.failed.length > 0) {
      return {
        success: false,
        data,
        error: `Falha ao processar ${data.failed.length} solicitação(ões): ${data.failed
          .map((f) => f.error)
          .join(", ")}`,
      };
    }

    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
