import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import type { CreateRefundSchema } from "@/models/refund.model";
import type { RefundRequest } from "@/repositories/refund.repository";
import { RefundService } from "@/services/refund.service";
import * as refundActions from "./refund.actions";

const {
  submitRefundRequest,
  getRefundRequestsAction,
  updateRefundRequestAction,
  deleteRefundRequestAction,
  deleteBatchRefundRequestsAction,
  markRefundAsPaidAction,
  markBatchRefundsAsPaidAction,
} = refundActions as unknown as {
  submitRefundRequest: typeof refundActions.submitRefundRequest;
  getRefundRequestsAction: typeof refundActions.getRefundRequestsAction;
  updateRefundRequestAction: (
    id: string,
    payload: unknown,
  ) => Promise<{ success: boolean; data?: RefundRequest; error?: string }>;
  deleteRefundRequestAction: (
    id: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteBatchRefundRequestsAction: (requestIds: string[]) => Promise<{
    success: boolean;
    data?: {
      succeeded: string[];
      failed: Array<{ id: string; error: string }>;
    };
    error?: string;
  }>;
  markRefundAsPaidAction: typeof refundActions.markRefundAsPaidAction;
  markBatchRefundsAsPaidAction: typeof refundActions.markBatchRefundsAsPaidAction;
};

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

describe("updateRefundRequestAction", () => {
  let mockServiceInstance: {
    createRefundRequest: ReturnType<typeof vi.fn>;
    getRefundRequests: ReturnType<typeof vi.fn>;
    updateRefundRequest: ReturnType<typeof vi.fn>;
    deleteRefundRequest: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      createRefundRequest: vi.fn(),
      getRefundRequests: vi.fn(),
      updateRefundRequest: vi.fn(),
      deleteRefundRequest: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return mockServiceInstance as unknown as RefundService;
    });
  });

  it("should validate payload, call service.updateRefundRequest, revalidate /admin and return success with data", async () => {
    const validPayload = {
      requester_name: "Novo Nome",
      total_value: 120.0,
      status: "APPROVED" as const,
    };

    const mockUpdated: RefundRequest = {
      id: "req-1",
      requester_name: "Novo Nome",
      receipt_file_url: "https://example.com/receipt.pdf",
      status: "APPROVED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reviewed_by: null,
      issuer_name: null,
      issuer_cnpj: null,
      receiver_cnpj: null,
      total_value: 120.0,
      issue_date: null,
      issue_number: null,
      description: null,
    };

    mockServiceInstance.updateRefundRequest.mockResolvedValue(mockUpdated);

    const result = await updateRefundRequestAction("req-1", validPayload);

    expect(RefundService).toHaveBeenCalled();
    expect(mockServiceInstance.updateRefundRequest).toHaveBeenCalledWith(
      "req-1",
      validPayload,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({ success: true, data: mockUpdated });
  });

  it("should return false and error string without calling service when payload validation fails", async () => {
    const invalidPayload = {
      total_value: -50,
    };

    const result = await updateRefundRequestAction("req-1", invalidPayload);

    expect(result.success).toBe(false);
    expect(mockServiceInstance.updateRefundRequest).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("should return false and error string when service throws an error", async () => {
    const validPayload = {
      requester_name: "Nome Valido",
    };

    mockServiceInstance.updateRefundRequest.mockRejectedValue(
      new Error("Solicitação de reembolso não encontrada"),
    );

    const result = await updateRefundRequestAction("req-404", validPayload);

    expect(result).toEqual({
      success: false,
      error: "Solicitação de reembolso não encontrada",
    });
  });
});

describe("deleteRefundRequestAction", () => {
  let mockServiceInstance: {
    createRefundRequest: ReturnType<typeof vi.fn>;
    getRefundRequests: ReturnType<typeof vi.fn>;
    updateRefundRequest: ReturnType<typeof vi.fn>;
    deleteRefundRequest: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      createRefundRequest: vi.fn(),
      getRefundRequests: vi.fn(),
      updateRefundRequest: vi.fn(),
      deleteRefundRequest: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return mockServiceInstance as unknown as RefundService;
    });
  });

  it("should call service.deleteRefundRequest, revalidate /admin and return success", async () => {
    mockServiceInstance.deleteRefundRequest.mockResolvedValue(undefined);

    const result = await deleteRefundRequestAction("req-1");

    expect(RefundService).toHaveBeenCalled();
    expect(mockServiceInstance.deleteRefundRequest).toHaveBeenCalledWith(
      "req-1",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({ success: true });
  });

  it("should return false and error string when service throws an error", async () => {
    mockServiceInstance.deleteRefundRequest.mockRejectedValue(
      new Error("Falha ao deletar"),
    );

    const result = await deleteRefundRequestAction("req-1");

    expect(result).toEqual({ success: false, error: "Falha ao deletar" });
  });
});

describe("deleteBatchRefundRequestsAction", () => {
  let mockServiceInstance: {
    deleteBatchRefundRequests: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      deleteBatchRefundRequests: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return mockServiceInstance as unknown as RefundService;
    });
  });

  it("should return { success: false, error: 'Nenhuma solicitação selecionada' } when requestIds is empty without calling RefundService or revalidatePath", async () => {
    const result = await deleteBatchRefundRequestsAction([]);

    expect(result).toEqual({
      success: false,
      error: "Nenhuma solicitação selecionada",
    });
    expect(RefundService).not.toHaveBeenCalled();
    expect(
      mockServiceInstance.deleteBatchRefundRequests,
    ).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("should call refundService.deleteBatchRefundRequests, revalidatePath('/admin'), and return { success: true, data } when all succeed", async () => {
    const batchResult = {
      succeeded: ["req-1", "req-2"],
      failed: [],
    };
    mockServiceInstance.deleteBatchRefundRequests.mockResolvedValue(
      batchResult,
    );

    const result = await deleteBatchRefundRequestsAction(["req-1", "req-2"]);

    expect(RefundService).toHaveBeenCalled();
    expect(mockServiceInstance.deleteBatchRefundRequests).toHaveBeenCalledWith([
      "req-1",
      "req-2",
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({
      success: true,
      data: batchResult,
    });
  });

  it("should revalidatePath('/admin') and return { success: false, data, error } when there are partial failures (failed.length > 0)", async () => {
    const batchResult = {
      succeeded: ["req-1"],
      failed: [
        {
          id: "req-2",
          error: "Solicitação de reembolso não encontrada",
        },
      ],
    };
    mockServiceInstance.deleteBatchRefundRequests.mockResolvedValue(
      batchResult,
    );

    const result = await deleteBatchRefundRequestsAction(["req-1", "req-2"]);

    expect(mockServiceInstance.deleteBatchRefundRequests).toHaveBeenCalledWith([
      "req-1",
      "req-2",
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({
      success: false,
      data: batchResult,
      error: expect.stringContaining("excluir"),
    });
  });

  it("should revalidatePath('/admin') and return { success: false, data, error } when all deletions fail (failed.length > 0)", async () => {
    const batchResult = {
      succeeded: [],
      failed: [
        { id: "req-1", error: "Erro no banco" },
        { id: "req-2", error: "Erro no storage" },
      ],
    };
    mockServiceInstance.deleteBatchRefundRequests.mockResolvedValue(
      batchResult,
    );

    const result = await deleteBatchRefundRequestsAction(["req-1", "req-2"]);

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({
      success: false,
      data: batchResult,
      error: expect.stringContaining("excluir"),
    });
  });

  it("should return { success: false, error } when refundService.deleteBatchRefundRequests throws an unexpected exception", async () => {
    mockServiceInstance.deleteBatchRefundRequests.mockRejectedValue(
      new Error("Erro inesperado ao excluir lote"),
    );

    const result = await deleteBatchRefundRequestsAction(["req-1", "req-2"]);

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Erro inesperado ao excluir lote",
    });
  });

  it("should handle non-Error exceptions and return { success: false, error } with stringified error", async () => {
    mockServiceInstance.deleteBatchRefundRequests.mockRejectedValue(
      "Falha crítica desconhecida",
    );

    const result = await deleteBatchRefundRequestsAction(["req-1"]);

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Falha crítica desconhecida",
    });
  });
});

describe("markRefundAsPaidAction", () => {
  let mockServiceInstance: {
    markAsPaid: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      markAsPaid: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return mockServiceInstance as unknown as RefundService;
    });
  });

  it("should call refundService.markAsPaid, revalidatePath('/admin'), and return { success: true, data }", async () => {
    const mockPaidRequest: RefundRequest = {
      id: "req-sent-1",
      requester_name: "Elena Ramos",
      receipt_file_url: "https://example.com/receipt.pdf",
      status: "PAID",
      created_at: "2026-10-25T10:00:00Z",
      updated_at: "2026-10-26T10:00:00Z",
      reviewed_by: "admin-1",
      issuer_name: "Restaurante Bunkyo",
      issuer_cnpj: "12.345.678/0001-90",
      receiver_cnpj: "98.765.432/0001-10",
      total_value: 150.0,
      issue_date: "2026-10-25",
      issue_number: "NF-100",
      description: "Almoço evento",
    };

    mockServiceInstance.markAsPaid.mockResolvedValue(mockPaidRequest);

    const result = await markRefundAsPaidAction("req-sent-1");

    expect(RefundService).toHaveBeenCalled();
    expect(mockServiceInstance.markAsPaid).toHaveBeenCalledWith("req-sent-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({ success: true, data: mockPaidRequest });
  });

  it("should return { success: false, error } without calling revalidatePath when RefundService throws an Error", async () => {
    mockServiceInstance.markAsPaid.mockRejectedValue(
      new Error(
        "Apenas solicitações com status Enviado (SENT) podem ser marcadas como pagas",
      ),
    );

    const result = await markRefundAsPaidAction("req-pending-1");

    expect(mockServiceInstance.markAsPaid).toHaveBeenCalledWith(
      "req-pending-1",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error:
        "Apenas solicitações com status Enviado (SENT) podem ser marcadas como pagas",
    });
  });

  it("should handle non-Error exceptions and return { success: false, error } with stringified error", async () => {
    mockServiceInstance.markAsPaid.mockRejectedValue(
      "Falha desconhecida ao marcar como pago",
    );

    const result = await markRefundAsPaidAction("req-1");

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Falha desconhecida ao marcar como pago",
    });
  });
});

describe("markBatchRefundsAsPaidAction", () => {
  let mockServiceInstance: {
    markBatchAsPaid: ReturnType<typeof vi.fn>;
  };

  const mockPaidReq1: RefundRequest = {
    id: "req-sent-1",
    requester_name: "Elena Ramos",
    receipt_file_url: "https://example.com/1.pdf",
    status: "PAID",
    created_at: "2026-10-25T10:00:00Z",
    updated_at: "2026-10-26T10:00:00Z",
    reviewed_by: "admin-1",
    issuer_name: "Restaurante Sabor",
    issuer_cnpj: "12.345.678/0001-90",
    receiver_cnpj: null,
    total_value: 150.0,
    issue_date: "2026-10-25",
    issue_number: "NF-101",
    description: "Almoço",
  };

  const mockPaidReq2: RefundRequest = {
    ...mockPaidReq1,
    id: "req-sent-2",
    requester_name: "Felipe Costa",
    total_value: 90.0,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      markBatchAsPaid: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return mockServiceInstance as unknown as RefundService;
    });
  });

  it("should return { success: false, error: 'Nenhuma solicitação selecionada' } when requestIds is empty without calling RefundService or revalidatePath", async () => {
    const result = await markBatchRefundsAsPaidAction([]);

    expect(result).toEqual({
      success: false,
      error: "Nenhuma solicitação selecionada",
    });
    expect(RefundService).not.toHaveBeenCalled();
    expect(mockServiceInstance.markBatchAsPaid).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("should call refundService.markBatchAsPaid, revalidatePath('/admin'), and return { success: true, data } when all succeed", async () => {
    const batchResult = {
      succeeded: [mockPaidReq1, mockPaidReq2],
      failed: [],
    };
    mockServiceInstance.markBatchAsPaid.mockResolvedValue(batchResult);

    const result = await markBatchRefundsAsPaidAction([
      "req-sent-1",
      "req-sent-2",
    ]);

    expect(RefundService).toHaveBeenCalled();
    expect(mockServiceInstance.markBatchAsPaid).toHaveBeenCalledWith([
      "req-sent-1",
      "req-sent-2",
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({
      success: true,
      data: batchResult,
    });
  });

  it("should revalidatePath('/admin') and return { success: false, data, error } when there are partial failures (failed.length > 0)", async () => {
    const batchResult = {
      succeeded: [mockPaidReq1],
      failed: [
        {
          id: "req-sent-2",
          error: "Solicitação de reembolso não encontrada",
        },
      ],
    };
    mockServiceInstance.markBatchAsPaid.mockResolvedValue(batchResult);

    const result = await markBatchRefundsAsPaidAction([
      "req-sent-1",
      "req-sent-2",
    ]);

    expect(mockServiceInstance.markBatchAsPaid).toHaveBeenCalledWith([
      "req-sent-1",
      "req-sent-2",
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({
      success: false,
      data: batchResult,
      error: expect.stringContaining("Solicitação de reembolso não encontrada"),
    });
    expect(result.error).toMatch(/falha/i);
  });

  it("should revalidatePath('/admin') and return { success: false, data, error } when all items fail (failed.length > 0)", async () => {
    const batchResult = {
      succeeded: [],
      failed: [
        { id: "req-1", error: "Status inválido" },
        { id: "req-2", error: "Erro no banco" },
      ],
    };
    mockServiceInstance.markBatchAsPaid.mockResolvedValue(batchResult);

    const result = await markBatchRefundsAsPaidAction(["req-1", "req-2"]);

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({
      success: false,
      data: batchResult,
      error: expect.stringContaining("Status inválido"),
    });
    expect(result.error).toContain("Erro no banco");
    expect(result.error).toMatch(/falha/i);
  });

  it("should return { success: false, error } without calling revalidatePath when refundService.markBatchAsPaid throws an unexpected exception", async () => {
    mockServiceInstance.markBatchAsPaid.mockRejectedValue(
      new Error("Erro inesperado ao marcar lote como pago"),
    );

    const result = await markBatchRefundsAsPaidAction([
      "req-sent-1",
      "req-sent-2",
    ]);

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Erro inesperado ao marcar lote como pago",
    });
  });

  it("should handle non-Error exceptions and return { success: false, error } with stringified error", async () => {
    mockServiceInstance.markBatchAsPaid.mockRejectedValue(
      "Falha crítica desconhecida",
    );

    const result = await markBatchRefundsAsPaidAction(["req-sent-1"]);

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Falha crítica desconhecida",
    });
  });
});
