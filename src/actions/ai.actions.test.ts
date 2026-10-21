import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RefundRequest } from "@/repositories/refund.repository";
import { RefundService } from "@/services/refund.service";
import { processBatchReceiptsAction, processReceiptAction } from "./ai.actions";

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
  let mockApproveAndProcessBatchReceipts: ReturnType<typeof vi.fn>;

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
    mockApproveAndProcessBatchReceipts = vi.fn();
    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return {
        approveAndProcessReceipt: mockApproveAndProcessReceipt,
        approveAndProcessBatchReceipts: mockApproveAndProcessBatchReceipts,
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

describe("processBatchReceiptsAction", () => {
  let mockApproveAndProcessBatchReceipts: ReturnType<typeof vi.fn>;

  const mockUpdatedRequest: RefundRequest = {
    id: "req-1",
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
    mockApproveAndProcessBatchReceipts = vi.fn();
    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return {
        approveAndProcessBatchReceipts: mockApproveAndProcessBatchReceipts,
      } as unknown as RefundService;
    });
  });

  it("should return { success: false, error: 'Nenhuma solicitação selecionada' } when requestIds is empty", async () => {
    const result = await processBatchReceiptsAction([]);

    expect(result).toEqual({
      success: false,
      error: "Nenhuma solicitação selecionada",
    });
    expect(mockApproveAndProcessBatchReceipts).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("should call approveAndProcessBatchReceipts, revalidate /admin and return success true when all succeed", async () => {
    const batchResult = {
      succeeded: [mockUpdatedRequest],
      failed: [],
    };
    mockApproveAndProcessBatchReceipts.mockResolvedValue(batchResult);

    const result = await processBatchReceiptsAction(["req-1"]);

    expect(RefundService).toHaveBeenCalled();
    expect(mockApproveAndProcessBatchReceipts).toHaveBeenCalledWith(["req-1"]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({
      success: true,
      data: batchResult,
    });
  });

  it("should revalidate /admin and return success false with error message when there are partial failures", async () => {
    const batchResult = {
      succeeded: [mockUpdatedRequest],
      failed: [{ id: "req-2", error: "Erro de IA" }],
    };
    mockApproveAndProcessBatchReceipts.mockResolvedValue(batchResult);

    const result = await processBatchReceiptsAction(["req-1", "req-2"]);

    expect(mockApproveAndProcessBatchReceipts).toHaveBeenCalledWith([
      "req-1",
      "req-2",
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({
      success: false,
      data: batchResult,
      error: expect.stringContaining("Falha ao processar"),
    });
  });
});
