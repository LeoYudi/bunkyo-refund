import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/models/database.types";
import type { CreateRefundSchema } from "@/models/refund.model";

export type RefundRequest =
  Database["public"]["Tables"]["refund_requests"]["Row"];

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return String(error);
}

export class RefundRepository {
  constructor(private supabaseClient?: SupabaseClient<Database>) {}

  private async getClient() {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }
    return await createClient();
  }

  async create(
    data: z.infer<typeof CreateRefundSchema>,
  ): Promise<RefundRequest> {
    const supabase = await this.getClient();
    const { data: created, error } = await supabase.rpc(
      "create_refund_request",
      { payload: data },
    );

    if (error) {
      throw new Error(extractErrorMessage(error));
    }

    return created;
  }

  async findById(id: string): Promise<RefundRequest | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("refund_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "PGRST116"
      ) {
        return null;
      }
      throw new Error(extractErrorMessage(error));
    }

    return data;
  }

  async updateStatus(
    id: string,
    status: Database["public"]["Enums"]["refund_status"],
  ): Promise<RefundRequest> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("refund_requests")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(extractErrorMessage(error));
    }

    return data;
  }
}
