import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/models/database.types";
import type { CreateRefundSchema } from "@/models/refund.model";
import { RefundRepository } from "@/repositories/refund.repository";
import { submitRefundRequest } from "./refund.actions";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/repositories/refund.repository", () => {
  return {
    RefundRepository: vi.fn(),
  };
});

describe("submitRefundRequest", () => {
  const mockSupabaseClient = {} as unknown as SupabaseClient<Database>;
  let mockRepositoryInstance: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    // Setup mock repository instance and its methods
    mockRepositoryInstance = {
      create: vi.fn(),
    };
    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundRepository).mockImplementation(function () {
      return mockRepositoryInstance as unknown as RefundRepository;
    });
  });

  it("should successfully validate and insert a refund request", async () => {
    const payload = {
      requester_name: "John Doe",
      receipt_file_url: "https://example.com/receipt.pdf",
    };

    const mockCreatedRefund = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      ...payload,
      status: "PENDING" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reviewed_by: null,
      issuer_name: null,
      issuer_cnpj: null,
      receiver_cnpj: null,
      total_value: null,
      issue_date: null,
      issue_number: null,
      description: null,
    };

    mockRepositoryInstance.create.mockResolvedValue(mockCreatedRefund);

    const result = await submitRefundRequest(payload);

    expect(createClient).toHaveBeenCalled();
    expect(RefundRepository).toHaveBeenCalledWith(mockSupabaseClient);
    expect(mockRepositoryInstance.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true, data: mockCreatedRefund });
  });

  it("should return false and error string on Zod validation failure", async () => {
    const invalidPayload = {
      requester_name: "J", // invalid, min 2 chars
      receipt_file_url: "not-a-url",
    };

    const result = await submitRefundRequest(
      invalidPayload as z.infer<typeof CreateRefundSchema>,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(createClient).not.toHaveBeenCalled();
    expect(RefundRepository).not.toHaveBeenCalled();
  });

  it("should handle repository error (e.g. database failure)", async () => {
    const payload = {
      requester_name: "John Doe",
      receipt_file_url: "https://example.com/receipt.pdf",
    };

    mockRepositoryInstance.create.mockRejectedValue(
      new Error("DB Connection Failed"),
    );

    const result = await submitRefundRequest(payload);

    expect(result).toEqual({ success: false, error: "DB Connection Failed" });
    expect(mockRepositoryInstance.create).toHaveBeenCalled();
  });
});
