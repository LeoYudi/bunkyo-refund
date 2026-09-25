"use server";

import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { RefundSchema } from "@/models/refund.model";
import { CreateRefundSchema } from "@/models/refund.model";
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
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
