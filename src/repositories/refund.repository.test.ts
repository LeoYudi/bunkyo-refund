import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/models/database.types";
import { RefundRepository } from "./refund.repository";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn(),
  };
});

const mockCreateClient = (mock: unknown) => {
  (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mock);
};

describe("RefundRepository", () => {
  let repository: RefundRepository;

  beforeEach(() => {
    repository = new RefundRepository();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new refund request", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            requester_name: "John Doe",
            receipt_file_url: "https://example.com/receipt.pdf",
            status: "PENDING",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: null,
            issue_date: null,
            issue_number: null,
            issuer_cnpj: null,
            issuer_name: null,
            receiver_cnpj: null,
            reviewed_by: null,
            total_value: null,
          },
          error: null,
        }),
        rpc: vi.fn().mockResolvedValue({
          data: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            requester_name: "John Doe",
            receipt_file_url: "https://example.com/receipt.pdf",
            status: "PENDING",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: null,
            issue_date: null,
            issue_number: null,
            issuer_cnpj: null,
            issuer_name: null,
            receiver_cnpj: null,
            reviewed_by: null,
            total_value: null,
          },
          error: null,
        }),
      };

      mockCreateClient(mockSupabase);

      const result = await repository.create({
        requester_name: "John Doe",
        receipt_file_url: "https://example.com/receipt.pdf",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(result.requester_name).toBe("John Doe");
      expect(result.status).toBe("PENDING");

      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.rpc).toHaveBeenCalledWith("create_refund_request", {
        payload: {
          requester_name: "John Doe",
          receipt_file_url: "https://example.com/receipt.pdf",
        },
      });
    });

    it("should throw an error when supabase returns an error", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null, // the old implementation won't throw because we mock it to succeed
        }),
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Supabase error"),
        }),
      };

      mockCreateClient(mockSupabase);

      await expect(
        repository.create({
          requester_name: "John Doe",
          receipt_file_url: "https://example.com/receipt.pdf",
        }),
      ).rejects.toThrow("Supabase error");
    });
  });

  describe("updateStatus", () => {
    it("should update the status of a refund request", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            requester_name: "John Doe",
            receipt_file_url: "https://example.com/receipt.pdf",
            status: "APPROVED",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: null,
            issue_date: null,
            issue_number: null,
            issuer_cnpj: null,
            issuer_name: null,
            receiver_cnpj: null,
            reviewed_by: null,
            total_value: null,
          },
          error: null,
        }),
      };

      mockCreateClient(mockSupabase);

      const result = await repository.updateStatus(
        "123e4567-e89b-12d3-a456-426614174000",
        "APPROVED",
      );

      expect(result).toBeDefined();
      expect(result.status).toBe("APPROVED");

      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("refund_requests");
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: "APPROVED" });
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        "id",
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });

    it("should throw an error when supabase returns an error on update", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Update error"),
        }),
      };

      mockCreateClient(mockSupabase);

      await expect(repository.updateStatus("123", "APPROVED")).rejects.toThrow(
        "Update error",
      );
    });
  });

  describe("findById", () => {
    it("should fetch a refund request by id", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            requester_name: "John Doe",
            receipt_file_url: "https://example.com/receipt.pdf",
            status: "PENDING",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: null,
            issue_date: null,
            issue_number: null,
            issuer_cnpj: null,
            issuer_name: null,
            receiver_cnpj: null,
            reviewed_by: null,
            total_value: null,
          },
          error: null,
        }),
      };

      mockCreateClient(mockSupabase);

      const result = await repository.findById(
        "123e4567-e89b-12d3-a456-426614174000",
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe("123e4567-e89b-12d3-a456-426614174000");

      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("refund_requests");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        "id",
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });

    it("should return null if refund request is not found", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: "PGRST116",
            details: "The result contains 0 rows",
            hint: null,
            message: "JSON object requested, multiple (or no) rows returned",
          },
        }),
      };

      mockCreateClient(mockSupabase);

      const result = await repository.findById("non-existent-id");

      expect(result).toBeNull();
    });

    it("should throw an error if supabase returns an error other than PGRST116", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: "SOME_OTHER_ERROR",
            message: "Database connection failed",
          },
        }),
      };

      mockCreateClient(mockSupabase);

      await expect(repository.findById("123")).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("findAll", () => {
    it("should fetch all refund requests ordered by created_at descending", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "1",
              requester_name: "John Doe",
              status: "PENDING",
              created_at: new Date().toISOString(),
            },
            {
              id: "2",
              requester_name: "Jane Doe",
              status: "APPROVED",
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      };

      mockCreateClient(mockSupabase);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("1");
      expect(result[1].id).toBe("2");

      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("refund_requests");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });

    it("should throw an error when supabase returns an error", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Supabase error"),
        }),
      };

      mockCreateClient(mockSupabase);

      await expect(repository.findAll()).rejects.toThrow("Supabase error");
    });
  });

  describe("update", () => {
    it("should update a refund request and return the updated record", async () => {
      const mockUpdatedRecord = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        requester_name: "John Doe",
        receipt_file_url: "https://example.com/receipt.pdf",
        status: "APPROVED" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: "Almoço com cliente",
        issue_date: "2026-09-25",
        issue_number: "NF-123",
        issuer_cnpj: "12345678000199",
        issuer_name: "Restaurante Bunkyo",
        receiver_cnpj: "98765432000199",
        reviewed_by: null,
        total_value: 150.5,
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedRecord,
          error: null,
        }),
      };

      mockCreateClient(mockSupabase);

      const payload: Database["public"]["Tables"]["refund_requests"]["Update"] =
        {
          status: "APPROVED",
          issuer_name: "Restaurante Bunkyo",
          issuer_cnpj: "12345678000199",
          receiver_cnpj: "98765432000199",
          total_value: 150.5,
          issue_date: "2026-09-25",
          issue_number: "NF-123",
          description: "Almoço com cliente",
        };

      const result = await repository.update(
        "123e4567-e89b-12d3-a456-426614174000",
        payload,
      );

      expect(result).toEqual(mockUpdatedRecord);
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("refund_requests");
      expect(mockSupabase.update).toHaveBeenCalledWith(payload);
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        "id",
        "123e4567-e89b-12d3-a456-426614174000",
      );
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it("should throw an error when supabase returns an error on update", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to update refund request"),
        }),
      };

      mockCreateClient(mockSupabase);

      await expect(
        repository.update("123e4567-e89b-12d3-a456-426614174000", {
          status: "APPROVED",
        }),
      ).rejects.toThrow("Failed to update refund request");
    });

    it("should throw an error with error message when supabase returns a PostgrestError object", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: "23505",
            message: "Database update constraint failed",
          },
        }),
      };

      mockCreateClient(mockSupabase);

      await expect(
        repository.update("123e4567-e89b-12d3-a456-426614174000", {
          status: "APPROVED",
        }),
      ).rejects.toThrow("Database update constraint failed");
    });
  });
});
