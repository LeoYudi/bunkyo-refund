import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RefundRequest } from "@/models/refund.model";
import { RefundService } from "@/services/refund.service";
import {
  exportToCsvAction,
  sendBatchPaymentEmailAction,
} from "./batch.actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/refund.service", () => ({
  RefundService: vi.fn(),
}));

describe("batch.actions", () => {
  let mockServiceInstance: {
    sendBatchPayment: ReturnType<typeof vi.fn>;
    exportRequestsToCsv: ReturnType<typeof vi.fn>;
  };

  const mockSentRequests: RefundRequest[] = [
    {
      id: "req-1",
      requester_name: "Alice Silva",
      status: "SENT",
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-20T10:00:00Z",
      description: "Almoço da equipe",
      issue_date: "2026-10-20",
      issue_number: "NF-101",
      issuer_cnpj: "12.345.678/0001-90",
      issuer_name: "Restaurante Sabor",
      receipt_file_url: "https://example.com/receipts/doc1.pdf",
      receiver_cnpj: "98.765.432/0001-10",
      reviewed_by: "admin-1",
      total_value: 150.5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = {
      sendBatchPayment: vi.fn(),
      exportRequestsToCsv: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: constructor mock requires function
    vi.mocked(RefundService).mockImplementation(function () {
      return mockServiceInstance as unknown as RefundService;
    });
  });

  describe("sendBatchPaymentEmailAction", () => {
    it("should return { success: false, error: 'Nenhuma solicitação selecionada' } when requestIds is empty", async () => {
      const result = await sendBatchPaymentEmailAction([]);

      expect(result).toEqual({
        success: false,
        error: "Nenhuma solicitação selecionada",
      });
      expect(mockServiceInstance.sendBatchPayment).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("should call refundService.sendBatchPayment, revalidatePath('/admin'), and return { success: true, data }", async () => {
      mockServiceInstance.sendBatchPayment.mockResolvedValue(mockSentRequests);

      const result = await sendBatchPaymentEmailAction(
        ["req-1"],
        "financeiro@bunkyo.org.br",
      );

      expect(mockServiceInstance.sendBatchPayment).toHaveBeenCalledWith(
        ["req-1"],
        "financeiro@bunkyo.org.br",
      );
      expect(revalidatePath).toHaveBeenCalledWith("/admin");
      expect(result).toEqual({
        success: true,
        data: mockSentRequests,
      });
    });

    it("should forward requestIds, recipientEmail, cc, and bcc to refundService.sendBatchPayment", async () => {
      mockServiceInstance.sendBatchPayment.mockResolvedValue(mockSentRequests);

      const result = await sendBatchPaymentEmailAction(
        ["req-1"],
        "financeiro@bunkyo.org.br",
        "cc@bunkyo.org.br",
        "bcc@bunkyo.org.br",
      );

      expect(mockServiceInstance.sendBatchPayment).toHaveBeenCalledWith(
        ["req-1"],
        "financeiro@bunkyo.org.br",
        "cc@bunkyo.org.br",
        "bcc@bunkyo.org.br",
      );
      expect(revalidatePath).toHaveBeenCalledWith("/admin");
      expect(result).toEqual({
        success: true,
        data: mockSentRequests,
      });
    });

    it("should catch service exceptions and return { success: false, error }", async () => {
      mockServiceInstance.sendBatchPayment.mockRejectedValue(
        new Error("Falha ao enviar e-mail pelo Gmail"),
      );

      const result = await sendBatchPaymentEmailAction(["req-1"]);

      expect(result).toEqual({
        success: false,
        error: "Falha ao enviar e-mail pelo Gmail",
      });
    });
  });

  describe("exportToCsvAction", () => {
    it("should return { success: false, error: 'Nenhuma solicitação selecionada' } when requestIds is empty", async () => {
      const result = await exportToCsvAction([]);

      expect(result).toEqual({
        success: false,
        error: "Nenhuma solicitação selecionada",
      });
      expect(mockServiceInstance.exportRequestsToCsv).not.toHaveBeenCalled();
    });

    it("should call refundService.exportRequestsToCsv and return { success: true, csv }", async () => {
      const expectedCsv =
        "\uFEFFID,Solicitante,Status,Emissor,CNPJ Emissor,CNPJ Tomador,Nº Nota,Data Emissão,Valor Total,Descrição,URL Comprovante,Criado em\nreq-1,Alice Silva,APPROVED";
      mockServiceInstance.exportRequestsToCsv.mockResolvedValue(expectedCsv);

      const result = await exportToCsvAction(["req-1"]);

      expect(mockServiceInstance.exportRequestsToCsv).toHaveBeenCalledWith([
        "req-1",
      ]);
      expect(result).toEqual({
        success: true,
        csv: expectedCsv,
      });
    });

    it("should catch service exceptions and return { success: false, error }", async () => {
      mockServiceInstance.exportRequestsToCsv.mockRejectedValue(
        new Error("Erro ao gerar CSV"),
      );

      const result = await exportToCsvAction(["req-1"]);

      expect(result).toEqual({
        success: false,
        error: "Erro ao gerar CSV",
      });
    });
  });
});
