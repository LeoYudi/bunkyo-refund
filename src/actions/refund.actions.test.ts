import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import type { CreateRefundSchema } from "@/models/refund.model";
import type { RefundRequest } from "@/repositories/refund.repository";
import { RefundService } from "@/services/refund.service";
import { getRefundRequestsAction, submitRefundRequest } from "./refund.actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/refund.service", () => {
  return {
    RefundService: vi.fn(),
  };
});

describe("submitRefundRequest", () => {
  let mockServiceInstance: {
    createRefundRequest: ReturnType<typeof vi.fn>;
    getRefundRequests: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      createRefundRequest: vi.fn(),
      getRefundRequests: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return mockServiceInstance as unknown as RefundService;
    });
  });

  it("should successfully validate and delegate refund creation to RefundService", async () => {
    const payload = {
      requester_name: "John Doe",
      receipt_file_url: "https://example.com/receipt.pdf",
    };

    const mockCreatedRefund: RefundRequest = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      ...payload,
      status: "PENDING",
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

    mockServiceInstance.createRefundRequest.mockResolvedValue(
      mockCreatedRefund,
    );

    const result = await submitRefundRequest(payload);

    expect(RefundService).toHaveBeenCalled();
    expect(mockServiceInstance.createRefundRequest).toHaveBeenCalledWith(
      payload,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({ success: true, data: mockCreatedRefund });
  });

  it("should return false and error string on Zod validation failure without calling RefundService", async () => {
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
    expect(RefundService).not.toHaveBeenCalled();
    expect(mockServiceInstance.createRefundRequest).not.toHaveBeenCalled();
  });

  it("should handle service error (e.g. database failure thrown by service)", async () => {
    const payload = {
      requester_name: "John Doe",
      receipt_file_url: "https://example.com/receipt.pdf",
    };

    mockServiceInstance.createRefundRequest.mockRejectedValue(
      new Error("DB Connection Failed"),
    );

    const result = await submitRefundRequest(payload);

    expect(result).toEqual({ success: false, error: "DB Connection Failed" });
    expect(mockServiceInstance.createRefundRequest).toHaveBeenCalled();
  });
});

describe("getRefundRequestsAction", () => {
  let mockServiceInstance: {
    createRefundRequest: ReturnType<typeof vi.fn>;
    getRefundRequests: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      createRefundRequest: vi.fn(),
      getRefundRequests: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return mockServiceInstance as unknown as RefundService;
    });
  });

  it("should return successfully fetched requests from RefundService", async () => {
    const mockRequests: RefundRequest[] = [
      {
        id: "1",
        requester_name: "User 1",
        receipt_file_url: "https://example.com/1.pdf",
        status: "PENDING",
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
      },
    ];
    mockServiceInstance.getRefundRequests.mockResolvedValue(mockRequests);

    const result = await getRefundRequestsAction();

    expect(RefundService).toHaveBeenCalled();
    expect(mockServiceInstance.getRefundRequests).toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: mockRequests });
  });

  it("should handle error when fetching requests from RefundService", async () => {
    mockServiceInstance.getRefundRequests.mockRejectedValue(
      new Error("Fetch failed"),
    );

    const result = await getRefundRequestsAction();

    expect(result).toEqual({ success: false, error: "Fetch failed" });
  });
});
