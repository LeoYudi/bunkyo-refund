import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { Database } from "@/models/database.types";
import type { CreateRefundSchema } from "@/models/refund.model";
import {
  RefundRepository,
  type RefundRequest,
} from "@/repositories/refund.repository";

export class RefundService {
  private repository: RefundRepository;

  constructor(
    repositoryOrClient?: RefundRepository | SupabaseClient<Database>,
  ) {
    if (repositoryOrClient instanceof RefundRepository) {
      this.repository = repositoryOrClient;
    } else if (
      repositoryOrClient &&
      typeof repositoryOrClient === "object" &&
      ("create" in repositoryOrClient || "findAll" in repositoryOrClient)
    ) {
      this.repository = repositoryOrClient as RefundRepository;
    } else {
      this.repository = new RefundRepository(
        repositoryOrClient as SupabaseClient<Database>,
      );
    }
  }

  async createRefundRequest(
    payload: z.infer<typeof CreateRefundSchema>,
  ): Promise<RefundRequest> {
    return this.repository.create(payload);
  }

  async getRefundRequests(): Promise<RefundRequest[]> {
    return this.repository.findAll();
  }
}
