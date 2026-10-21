"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { RefundRequest, RefundSchema } from "@/models/refund.model";
import { CreateRefundSchema } from "@/models/refund.model";
import { RefundService } from "@/services/refund.service";

export type SubmitRefundResult =
  | { success: true; data: z.infer<typeof RefundSchema> }
  | { success: false; error: string };

export async function submitRefundRequest(
  payload: z.infer<typeof CreateRefundSchema>,
): Promise<SubmitRefundResult> {
  const validationResult = CreateRefundSchema.safeParse(payload);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.message };
  }

  try {
    const refundService = new RefundService();
    const data = await refundService.createRefundRequest(validationResult.data);

    // Purge the client-side router cache for the admin dashboard
    revalidatePath("/admin");

    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export type GetRefundRequestsResult =
  | { success: true; data: RefundRequest[] }
  | { success: false; error: string };

export async function getRefundRequestsAction(): Promise<GetRefundRequestsResult> {
  try {
    const refundService = new RefundService();
    const data = await refundService.getRefundRequests();
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
