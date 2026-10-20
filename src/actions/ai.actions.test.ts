import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RefundRequest } from "@/repositories/refund.repository";
import { RefundService } from "@/services/refund.service";
import { processReceiptAction } from "./ai.actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/refund.service", () => {
  return {
    RefundService: vi.fn(),
  };
});

describe("processReceiptAction", () => {
  let mockApproveAndProcessReceipt: ReturnType<typeof vi.fn>;

  const mockUpdatedRequest: RefundRequest = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    requester_name: "Leonardo Higuti",
    receipt_file_url:
      "https://example.supabase.co/storage/v1/object/public/receipts/doc.pdf",
    status: "APPROVED",
    issuer_name: "Restaurante Bunkyo",
    issuer_cnpj: "12345678000199",
    receiver_cnpj: "98765432000199",
    total_value: 150.5,
    issue_date: "2026-09-25",
    issue_number: "NF-1234",
    description: "Almoço de negócios",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    reviewed_by: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApproveAndProcessReceipt = vi.fn();
    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return {
        approveAndProcessReceipt: mockApproveAndProcessReceipt,
      } as unknown as RefundService;
    });
  });

  it("should successfully approve and process receipt and revalidate /admin", async () => {
    mockApproveAndProcessReceipt.mockResolvedValue(mockUpdatedRequest);

    const result = await processReceiptAction(
      "123e4567-e89b-12d3-a456-426614174000",
    );

    expect(RefundService).toHaveBeenCalled();
    expect(mockApproveAndProcessReceipt).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174000",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({ success: true, data: mockUpdatedRequest });
  });

  it("should catch errors from RefundService and return success false with error message", async () => {
    mockApproveAndProcessReceipt.mockRejectedValue(
      new Error("Falha ao extrair dados da nota fiscal via IA"),
    );

    const result = await processReceiptAction(
      "123e4567-e89b-12d3-a456-426614174000",
    );

    expect(RefundService).toHaveBeenCalled();
    expect(mockApproveAndProcessReceipt).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174000",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Falha ao extrair dados da nota fiscal via IA",
    });
  });

  it("should handle non-Error exceptions and return success false with stringified error", async () => {
    mockApproveAndProcessReceipt.mockRejectedValue("Falha desconhecida");

    const result = await processReceiptAction(
      "123e4567-e89b-12d3-a456-426614174000",
    );

    expect(result).toEqual({
      success: false,
      error: "Falha desconhecida",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
