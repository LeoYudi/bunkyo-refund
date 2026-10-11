import { beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import type { CreateRefundSchema } from "@/models/refund.model";
import {
  RefundRepository,
  type RefundRequest,
} from "@/repositories/refund.repository";
import { RefundService } from "./refund.service";

vi.mock("@/repositories/refund.repository", () => {
  return {
    RefundRepository: vi.fn(),
  };
});

describe("RefundService", () => {
  let mockRepositoryInstance: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepositoryInstance = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
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
        issuer_name: "Restaurante Bunkyo",
        issuer_cnpj: "12345678000199",
        total_value: 150.5,
      };

      const mockCreatedRefund: RefundRequest = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        requester_name: payload.requester_name,
        receipt_file_url: payload.receipt_file_url,
        issuer_name: payload.issuer_name ?? null,
        issuer_cnpj: payload.issuer_cnpj ?? null,
        receiver_cnpj: null,
        total_value: payload.total_value ?? null,
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
});
