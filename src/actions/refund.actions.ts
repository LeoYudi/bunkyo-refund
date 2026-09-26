"use server";

import type { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RefundSchema } from "@/models/refund.model";
import { CreateRefundSchema } from "@/models/refund.model";
import type { RefundRequest } from "@/repositories/refund.repository";
import { RefundRepository } from "@/repositories/refund.repository";

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
    const supabase = await createClient();
    const repository = new RefundRepository(supabase);
    const data = await repository.create(validationResult.data);
    
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
    const supabase = await createClient();
    const repository = new RefundRepository(supabase);
    const data = await repository.findAll();
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
