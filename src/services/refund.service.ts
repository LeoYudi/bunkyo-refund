import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { Database } from "@/models/database.types";
import type { CreateRefundSchema, RefundRequest } from "@/models/refund.model";
import { RefundRepository } from "@/repositories/refund.repository";
import { processReceiptWithAI } from "@/services/ai.service";
import {
  type BatchEmailMetadata,
  sendBatchEmailWithGmail,
} from "@/services/email.service";

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
      this.repository = repositoryOrClient as unknown as RefundRepository;
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

  async approveAndProcessReceipt(requestId: string): Promise<RefundRequest> {
    const request = await this.repository.findById(requestId);
    if (!request?.receipt_file_url) {
      throw new Error("Solicitação de reembolso não encontrada");
    }

    await this.repository.updateStatus(requestId, "PROCESSING");

    try {
      const url = request.receipt_file_url;
      let storagePath = "";
      if (url.includes("/receipts/")) {
        const parts = url.split("/receipts/");
        const afterReceipts = parts[1] || "";
        storagePath = afterReceipts.split("?")[0] || "";
      } else {
        const urlWithoutQuery = url.split("?")[0] || "";
        const segments = urlWithoutQuery.split("/");
        storagePath = segments[segments.length - 1] || "";
      }

      const lowerPath = storagePath.toLowerCase();
      let mimeType = "application/octet-stream";
      if (lowerPath.endsWith(".pdf")) {
        mimeType = "application/pdf";
      } else if (lowerPath.endsWith(".png")) {
        mimeType = "image/png";
      } else if (lowerPath.endsWith(".webp")) {
        mimeType = "image/webp";
      } else if (lowerPath.endsWith(".gif")) {
        mimeType = "image/gif";
      } else if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
        mimeType = "image/jpeg";
      }

      const extractedData = await processReceiptWithAI(storagePath, mimeType);
      return await this.repository.update(requestId, {
        ...extractedData,
        status: "APPROVED",
      });
    } catch (error) {
      await this.repository.updateStatus(requestId, "PENDING");
      throw error;
    }
  }

  async approveAndProcessBatchReceipts(requestIds: string[]): Promise<{
    succeeded: RefundRequest[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const results = await Promise.allSettled(
      requestIds.map((id) => this.approveAndProcessReceipt(id)),
    );

    const succeeded: RefundRequest[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    results.forEach((res, index) => {
      const id = requestIds[index];
      if (res.status === "fulfilled") {
        succeeded.push(res.value);
      } else {
        const errorMsg =
          res.reason instanceof Error ? res.reason.message : String(res.reason);
        failed.push({ id, error: errorMsg });
      }
    });

    return { succeeded, failed };
  }

  async sendBatchPayment(
    requestIds: string[],
    recipientEmail?: string,
    cc?: string,
    bcc?: string,
    _metadata?: BatchEmailMetadata,
  ): Promise<RefundRequest[]> {
    if (!requestIds || requestIds.length === 0) {
      throw new Error("Nenhuma solicitação selecionada");
    }

    const requests: RefundRequest[] = [];
    for (const id of requestIds) {
      const req = await this.repository.findById(id);
      if (!req) {
        throw new Error(`Solicitação de reembolso não encontrada: ${id}`);
      }
      requests.push(req);
    }

    await sendBatchEmailWithGmail({
      requests,
      recipientEmail,
      ...(cc !== undefined ? { cc } : {}),
      ...(bcc !== undefined ? { bcc } : {}),
      date: new Date().toLocaleDateString("pt-BR"),
    });

    const updatedRequests: RefundRequest[] = [];
    for (const id of requestIds) {
      const updated = await this.repository.updateStatus(id, "SENT");
      updatedRequests.push(updated);
    }

    return updatedRequests;
  }

  async exportRequestsToCsv(requestIds: string[]): Promise<string> {
    if (!requestIds || requestIds.length === 0) {
      throw new Error("Nenhuma solicitação selecionada");
    }

    const requests: RefundRequest[] = [];
    for (const id of requestIds) {
      const req = await this.repository.findById(id);
      if (!req) {
        throw new Error(`Solicitação de reembolso não encontrada: ${id}`);
      }
      requests.push(req);
    }

    const escapeCsvValue = (
      val: string | number | null | undefined,
    ): string => {
      if (val === null || val === undefined) {
        return "";
      }
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header =
      "ID,Solicitante,Status,Emissor,CNPJ Emissor,CNPJ Tomador,Nº Nota,Data Emissão,Valor Total,Descrição,URL Comprovante,Criado em";

    const rows = requests.map((req) =>
      [
        req.id,
        req.requester_name,
        req.status,
        req.issuer_name,
        req.issuer_cnpj,
        req.receiver_cnpj,
        req.issue_number,
        req.issue_date,
        req.total_value,
        req.description,
        req.receipt_file_url,
        req.created_at,
      ]
        .map(escapeCsvValue)
        .join(","),
    );

    return `\uFEFF${[header, ...rows].join("\n")}`;
  }
}
