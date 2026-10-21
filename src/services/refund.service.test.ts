import { beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import type { CreateRefundSchema } from "@/models/refund.model";
import {
  RefundRepository,
  type RefundRequest,
} from "@/repositories/refund.repository";
import { processReceiptWithAI } from "@/services/ai.service";
import { RefundService } from "./refund.service";

vi.mock("@/repositories/refund.repository", () => {
  return {
    RefundRepository: vi.fn(),
  };
});

vi.mock("@/services/ai.service", () => {
  return {
    processReceiptWithAI: vi.fn(),
  };
});

describe("RefundService", () => {
  let mockRepositoryInstance: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepositoryInstance = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      update: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundRepository).mockImplementation(function () {
      return mockRepositoryInstance as unknown as RefundRepository;
    });
  });

  describe("Constructor & Dependency Injection", () => {
    it("should instantiate default RefundRepository if no repository is provided", () => {
      new RefundService();
      expect(RefundRepository).toHaveBeenCalledTimes(1);
    });

    it("should use provided RefundRepository instance via dependency injection", async () => {
      const customRepoInstance = {
        create: vi.fn().mockResolvedValue({ id: "custom-1" }),
        findAll: vi.fn(),
        findById: vi.fn(),
        updateStatus: vi.fn(),
      } as unknown as RefundRepository;

      const service = new RefundService(customRepoInstance);

      const payload = {
        requester_name: "John Custom",
        receipt_file_url: "https://example.com/custom.pdf",
      };

      const result = await service.createRefundRequest(payload);

      expect(customRepoInstance.create).toHaveBeenCalledWith(payload);
      expect(mockRepositoryInstance.create).not.toHaveBeenCalled();
      expect(result).toEqual({ id: "custom-1" });
    });
  });

  describe("createRefundRequest", () => {
    it("should successfully delegate refund creation to RefundRepository", async () => {
      const service = new RefundService();

      const payload: z.infer<typeof CreateRefundSchema> = {
        requester_name: "Leonardo Higuti",
        receipt_file_url: "https://example.com/receipt.pdf",
      };

      const mockCreatedRefund: RefundRequest = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        requester_name: payload.requester_name,
        receipt_file_url: payload.receipt_file_url,
        issuer_name: null,
        issuer_cnpj: null,
        receiver_cnpj: null,
        total_value: null,
        issue_date: null,
        issue_number: null,
        description: null,
        status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reviewed_by: null,
      };

      mockRepositoryInstance.create.mockResolvedValue(mockCreatedRefund);

      const result = await service.createRefundRequest(payload);

      expect(mockRepositoryInstance.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockCreatedRefund);
    });

    it("should propagate errors thrown by RefundRepository during creation", async () => {
      const service = new RefundService();

      const payload: z.infer<typeof CreateRefundSchema> = {
        requester_name: "Leonardo Higuti",
        receipt_file_url: "https://example.com/receipt.pdf",
      };

      const dbError = new Error("Database insertion failure");
      mockRepositoryInstance.create.mockRejectedValue(dbError);

      await expect(service.createRefundRequest(payload)).rejects.toThrow(
        "Database insertion failure",
      );
      expect(mockRepositoryInstance.create).toHaveBeenCalledWith(payload);
    });
  });

  describe("getRefundRequests", () => {
    it("should successfully delegate requests listing to RefundRepository", async () => {
      const service = new RefundService();

      const mockRequests: RefundRequest[] = [
        {
          id: "req-1",
          requester_name: "User 1",
          receipt_file_url: "https://example.com/1.pdf",
          status: "PENDING",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reviewed_by: null,
          issuer_name: null,
          issuer_cnpj: null,
          receiver_cnpj: null,
          total_value: 100,
          issue_date: null,
          issue_number: null,
          description: null,
        },
        {
          id: "req-2",
          requester_name: "User 2",
          receipt_file_url: "https://example.com/2.pdf",
          status: "APPROVED",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reviewed_by: "admin-id",
          issuer_name: null,
          issuer_cnpj: null,
          receiver_cnpj: null,
          total_value: 250,
          issue_date: null,
          issue_number: null,
          description: null,
        },
      ];

      mockRepositoryInstance.findAll.mockResolvedValue(mockRequests);

      const result = await service.getRefundRequests();

      expect(mockRepositoryInstance.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRequests);
    });

    it("should return empty list if no refund requests exist", async () => {
      const service = new RefundService();
      mockRepositoryInstance.findAll.mockResolvedValue([]);

      const result = await service.getRefundRequests();

      expect(mockRepositoryInstance.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it("should propagate errors thrown by RefundRepository during listing", async () => {
      const service = new RefundService();
      mockRepositoryInstance.findAll.mockRejectedValue(
        new Error("Database connection timeout"),
      );

      await expect(service.getRefundRequests()).rejects.toThrow(
        "Database connection timeout",
      );
      expect(mockRepositoryInstance.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("approveAndProcessReceipt", () => {
    const mockPendingRequest: RefundRequest = {
      id: "req-123",
      requester_name: "Leonardo Higuti",
      receipt_file_url:
        "https://example.supabase.co/storage/v1/object/public/receipts/20260925-doc.pdf",
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

    const mockExtractedData = {
      issuer_name: "Restaurante Bunkyo",
      issuer_cnpj: "12345678000199",
      receiver_cnpj: "98765432000199",
      total_value: 150.5,
      issue_date: "2026-09-25",
      issue_number: "NF-1234",
      description: "Almoço com equipe",
    };

    it("should successfully approve and process a PDF receipt", async () => {
      const service = new RefundService();

      const mockProcessingRequest: RefundRequest = {
        ...mockPendingRequest,
        status: "PROCESSING",
      };

      const mockApprovedRequest: RefundRequest = {
        ...mockPendingRequest,
        ...mockExtractedData,
        status: "APPROVED",
      };

      mockRepositoryInstance.findById.mockResolvedValue(mockPendingRequest);
      mockRepositoryInstance.updateStatus.mockResolvedValue(
        mockProcessingRequest,
      );
      vi.mocked(processReceiptWithAI).mockResolvedValue(mockExtractedData);
      mockRepositoryInstance.update.mockResolvedValue(mockApprovedRequest);

      const result = await service.approveAndProcessReceipt("req-123");

      expect(mockRepositoryInstance.findById).toHaveBeenCalledWith("req-123");
      expect(mockRepositoryInstance.updateStatus).toHaveBeenCalledWith(
        "req-123",
        "PROCESSING",
      );
      expect(processReceiptWithAI).toHaveBeenCalledWith(
        "20260925-doc.pdf",
        "application/pdf",
      );
      expect(mockRepositoryInstance.update).toHaveBeenCalledWith("req-123", {
        ...mockExtractedData,
        status: "APPROVED",
      });
      expect(result).toEqual(mockApprovedRequest);
    });

    it("should extract storagePath and mimeType correctly for PNG image receipt", async () => {
      const service = new RefundService();

      const pngRequest: RefundRequest = {
        ...mockPendingRequest,
        receipt_file_url:
          "https://example.supabase.co/storage/v1/object/public/receipts/recibo-foto.png",
      };

      mockRepositoryInstance.findById.mockResolvedValue(pngRequest);
      mockRepositoryInstance.updateStatus.mockResolvedValue({
        ...pngRequest,
        status: "PROCESSING",
      });
      vi.mocked(processReceiptWithAI).mockResolvedValue(mockExtractedData);
      mockRepositoryInstance.update.mockResolvedValue({
        ...pngRequest,
        ...mockExtractedData,
        status: "APPROVED",
      });

      await service.approveAndProcessReceipt("req-123");

      expect(processReceiptWithAI).toHaveBeenCalledWith(
        "recibo-foto.png",
        "image/png",
      );
    });

    it("should extract storagePath and mimeType correctly for JPEG image receipt", async () => {
      const service = new RefundService();

      const jpegRequest: RefundRequest = {
        ...mockPendingRequest,
        receipt_file_url:
          "https://example.supabase.co/storage/v1/object/public/receipts/recibo.jpeg",
      };

      mockRepositoryInstance.findById.mockResolvedValue(jpegRequest);
      mockRepositoryInstance.updateStatus.mockResolvedValue({
        ...jpegRequest,
        status: "PROCESSING",
      });
      vi.mocked(processReceiptWithAI).mockResolvedValue(mockExtractedData);
      mockRepositoryInstance.update.mockResolvedValue({
        ...jpegRequest,
        ...mockExtractedData,
        status: "APPROVED",
      });

      await service.approveAndProcessReceipt("req-123");

      expect(processReceiptWithAI).toHaveBeenCalledWith(
        "recibo.jpeg",
        "image/jpeg",
      );
    });

    it("should extract storagePath and mimeType correctly for JPG image receipt", async () => {
      const service = new RefundService();

      const jpgRequest: RefundRequest = {
        ...mockPendingRequest,
        receipt_file_url:
          "https://example.supabase.co/storage/v1/object/public/receipts/recibo-foto.jpg",
      };

      mockRepositoryInstance.findById.mockResolvedValue(jpgRequest);
      mockRepositoryInstance.updateStatus.mockResolvedValue({
        ...jpgRequest,
        status: "PROCESSING",
      });
      vi.mocked(processReceiptWithAI).mockResolvedValue(mockExtractedData);
      mockRepositoryInstance.update.mockResolvedValue({
        ...jpgRequest,
        ...mockExtractedData,
        status: "APPROVED",
      });

      await service.approveAndProcessReceipt("req-123");

      expect(processReceiptWithAI).toHaveBeenCalledWith(
        "recibo-foto.jpg",
        "image/jpeg",
      );
    });

    it("should handle uppercase file extensions correctly (e.g. .PDF, .JPG)", async () => {
      const service = new RefundService();

      const uppercasePdfRequest: RefundRequest = {
        ...mockPendingRequest,
        receipt_file_url:
          "https://example.supabase.co/storage/v1/object/public/receipts/DOCUMENTO.PDF",
      };

      mockRepositoryInstance.findById.mockResolvedValue(uppercasePdfRequest);
      mockRepositoryInstance.updateStatus.mockResolvedValue({
        ...uppercasePdfRequest,
        status: "PROCESSING",
      });
      vi.mocked(processReceiptWithAI).mockResolvedValue(mockExtractedData);
      mockRepositoryInstance.update.mockResolvedValue({
        ...uppercasePdfRequest,
        ...mockExtractedData,
        status: "APPROVED",
      });

      await service.approveAndProcessReceipt("req-123");

      expect(processReceiptWithAI).toHaveBeenCalledWith(
        "DOCUMENTO.PDF",
        "application/pdf",
      );
    });

    it("should handle null fields in extracted AI data and update request with status APPROVED", async () => {
      const service = new RefundService();

      const partialExtractedData = {
        issuer_name: "Restaurante Bunkyo",
        issuer_cnpj: null,
        receiver_cnpj: null,
        total_value: null,
        issue_date: null,
        issue_number: null,
        description: null,
      };

      const mockApprovedWithNulls: RefundRequest = {
        ...mockPendingRequest,
        ...partialExtractedData,
        status: "APPROVED",
      };

      mockRepositoryInstance.findById.mockResolvedValue(mockPendingRequest);
      mockRepositoryInstance.updateStatus.mockResolvedValue({
        ...mockPendingRequest,
        status: "PROCESSING",
      });
      vi.mocked(processReceiptWithAI).mockResolvedValue(partialExtractedData);
      mockRepositoryInstance.update.mockResolvedValue(mockApprovedWithNulls);

      const result = await service.approveAndProcessReceipt("req-123");

      expect(mockRepositoryInstance.update).toHaveBeenCalledWith("req-123", {
        ...partialExtractedData,
        status: "APPROVED",
      });
      expect(result).toEqual(mockApprovedWithNulls);
    });

    it("should throw an error when refund request is not found", async () => {
      const service = new RefundService();
      mockRepositoryInstance.findById.mockResolvedValue(null);

      await expect(
        service.approveAndProcessReceipt("non-existent-id"),
      ).rejects.toThrow("Solicitação de reembolso não encontrada");

      expect(mockRepositoryInstance.findById).toHaveBeenCalledWith(
        "non-existent-id",
      );
      expect(mockRepositoryInstance.updateStatus).not.toHaveBeenCalled();
      expect(processReceiptWithAI).not.toHaveBeenCalled();
      expect(mockRepositoryInstance.update).not.toHaveBeenCalled();
    });

    it("should revert status to PENDING and rethrow error when processReceiptWithAI fails", async () => {
      const service = new RefundService();

      mockRepositoryInstance.findById.mockResolvedValue(mockPendingRequest);
      mockRepositoryInstance.updateStatus.mockResolvedValue({
        ...mockPendingRequest,
        status: "PROCESSING",
      });
      vi.mocked(processReceiptWithAI).mockRejectedValue(
        new Error("AI extraction service unavailable"),
      );

      await expect(service.approveAndProcessReceipt("req-123")).rejects.toThrow(
        "AI extraction service unavailable",
      );

      expect(mockRepositoryInstance.updateStatus).toHaveBeenNthCalledWith(
        1,
        "req-123",
        "PROCESSING",
      );
      expect(mockRepositoryInstance.updateStatus).toHaveBeenNthCalledWith(
        2,
        "req-123",
        "PENDING",
      );
      expect(mockRepositoryInstance.update).not.toHaveBeenCalled();
    });

    it("should revert status to PENDING and rethrow error when repository.update fails after AI processing", async () => {
      const service = new RefundService();

      mockRepositoryInstance.findById.mockResolvedValue(mockPendingRequest);
      mockRepositoryInstance.updateStatus.mockResolvedValue({
        ...mockPendingRequest,
        status: "PROCESSING",
      });
      vi.mocked(processReceiptWithAI).mockResolvedValue(mockExtractedData);
      mockRepositoryInstance.update.mockRejectedValue(
        new Error("Database update error"),
      );

      await expect(service.approveAndProcessReceipt("req-123")).rejects.toThrow(
        "Database update error",
      );

      expect(mockRepositoryInstance.updateStatus).toHaveBeenNthCalledWith(
        1,
        "req-123",
        "PROCESSING",
      );
      expect(mockRepositoryInstance.updateStatus).toHaveBeenNthCalledWith(
        2,
        "req-123",
        "PENDING",
      );
    });
  });

  describe("approveAndProcessBatchReceipts", () => {
    const mockPendingReq1: RefundRequest = {
      id: "req-1",
      requester_name: "Alice",
      receipt_file_url:
        "https://example.supabase.co/storage/v1/object/public/receipts/doc1.pdf",
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

    const mockPendingReq2: RefundRequest = {
      id: "req-2",
      requester_name: "Bob",
      receipt_file_url:
        "https://example.supabase.co/storage/v1/object/public/receipts/doc2.pdf",
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

    const mockExtractedData = {
      issuer_name: "Restaurante Bunkyo",
      issuer_cnpj: "12345678000199",
      receiver_cnpj: "98765432000199",
      total_value: 150.5,
      issue_date: "2026-09-25",
      issue_number: "NF-1234",
      description: "Almoço com equipe",
    };

    const mockApprovedReq1: RefundRequest = {
      ...mockPendingReq1,
      ...mockExtractedData,
      status: "APPROVED",
    };

    const mockApprovedReq2: RefundRequest = {
      ...mockPendingReq2,
      ...mockExtractedData,
      status: "APPROVED",
    };

    it("should process multiple requests in batch successfully and return succeeded array with empty failed array", async () => {
      const service = new RefundService();

      mockRepositoryInstance.findById.mockImplementation(async (id: string) => {
        if (id === "req-1") return mockPendingReq1;
        if (id === "req-2") return mockPendingReq2;
        return null;
      });
      mockRepositoryInstance.updateStatus.mockImplementation(
        async (id: string, status: RefundRequest["status"]) => {
          const base = id === "req-1" ? mockPendingReq1 : mockPendingReq2;
          return { ...base, status };
        },
      );
      vi.mocked(processReceiptWithAI).mockResolvedValue(mockExtractedData);
      mockRepositoryInstance.update.mockImplementation(async (id: string) => {
        return id === "req-1" ? mockApprovedReq1 : mockApprovedReq2;
      });

      const result = await service.approveAndProcessBatchReceipts([
        "req-1",
        "req-2",
      ]);

      expect(result).toEqual({
        succeeded: [mockApprovedReq1, mockApprovedReq2],
        failed: [],
      });
    });

    it("should use Promise.allSettled to continue processing when one request fails, reverting only the failed one to PENDING", async () => {
      const service = new RefundService();

      mockRepositoryInstance.findById.mockImplementation(async (id: string) => {
        if (id === "req-1") return mockPendingReq1;
        if (id === "req-2") return mockPendingReq2;
        return null;
      });
      mockRepositoryInstance.updateStatus.mockImplementation(
        async (id: string, status: RefundRequest["status"]) => {
          const base = id === "req-1" ? mockPendingReq1 : mockPendingReq2;
          return { ...base, status };
        },
      );
      vi.mocked(processReceiptWithAI).mockImplementation(
        async (storagePath: string) => {
          if (storagePath === "doc2.pdf") {
            throw new Error("Falha na leitura de IA do recibo 2");
          }
          return mockExtractedData;
        },
      );
      mockRepositoryInstance.update.mockImplementation(async (id: string) => {
        return id === "req-1" ? mockApprovedReq1 : mockApprovedReq2;
      });

      const result = await service.approveAndProcessBatchReceipts([
        "req-1",
        "req-2",
      ]);

      expect(mockRepositoryInstance.updateStatus).toHaveBeenCalledWith(
        "req-2",
        "PENDING",
      );
      expect(result).toEqual({
        succeeded: [mockApprovedReq1],
        failed: [
          {
            id: "req-2",
            error: "Falha na leitura de IA do recibo 2",
          },
        ],
      });
    });
  });
});
