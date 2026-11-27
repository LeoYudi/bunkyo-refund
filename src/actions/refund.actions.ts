"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import {
  CreateRefundSchema,
  type RefundRequest,
  type RefundSchema,
  UpdateRefundSchema,
} from "@/models/refund.model";
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

export async function updateRefundRequestAction(
  id: string,
  payload: unknown,
): Promise<
  { success: true; data: RefundRequest } | { success: false; error: string }
> {
  const validation = UpdateRefundSchema.safeParse(payload);
  if (!validation.success) {
    const errorMsg =
      validation.error.issues?.[0]?.message ||
      validation.error.message ||
      "Dados inválidos";
    return { success: false, error: errorMsg };
  }

  try {
    const refundService = new RefundService();
    const data = await refundService.updateRefundRequest(id, validation.data);
    revalidatePath("/admin");
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function deleteRefundRequestAction(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const refundService = new RefundService();
    await refundService.deleteRefundRequest(id);
    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function deleteBatchRefundRequestsAction(
  requestIds: string[],
): Promise<{
  success: boolean;
  data?: {
    succeeded: string[];
    failed: Array<{ id: string; error: string }>;
  };
  error?: string;
}> {
  if (!requestIds || requestIds.length === 0) {
    return { success: false, error: "Nenhuma solicitação selecionada" };
  }

  try {
    const refundService = new RefundService();
    const data = await refundService.deleteBatchRefundRequests(requestIds);
    revalidatePath("/admin");

    if (data.failed.length > 0) {
      return {
        success: false,
        data,
        error: `Falha ao excluir ${data.failed.length} solicitação(ões): ${data.failed
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

export async function markRefundAsPaidAction(
  id: string,
): Promise<
  { success: true; data: RefundRequest } | { success: false; error: string }
> {
  try {
    const refundService = new RefundService();
    const data = await refundService.markAsPaid(id);
    revalidatePath("/admin");
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function markBatchRefundsAsPaidAction(
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
    const result = await refundService.markBatchAsPaid(requestIds);
    revalidatePath("/admin");

    if (result.failed.length > 0) {
      return {
        success: false,
        data: result,
        error: `Falha ao marcar ${result.failed.length} solicitação(ões) como paga(s): ${result.failed
          .map((f) => f.error)
          .join(", ")}`,
      };
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
