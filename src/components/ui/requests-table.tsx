"use client";

import { Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { processReceiptAction } from "@/actions/ai.actions";
import { REFUND_STATUS_MAP, type RefundRequest } from "@/models/refund.model";
import { Badge } from "./badge";
import { ReceiptModal } from "./receipt-modal";

export type { RefundRequest };

export interface RequestsTableProps {
  requests: RefundRequest[];
  onProcessRequest?: (requestId: string) => Promise<void> | void;
}

export function RequestsTable({
  requests,
  onProcessRequest,
}: RequestsTableProps) {
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProcess = async (id: string) => {
    setProcessingId(id);
    setErrorMessage(null);
    try {
      let result: { success: boolean; error?: string } | undefined;
      if (onProcessRequest) {
        await onProcessRequest(id);
      } else {
        result = await processReceiptAction(id);
      }
      if (result && !result.success) {
        setErrorMessage(result.error || "Erro ao processar solicitação");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      {errorMessage && (
        <div
          role="alert"
          className="m-4 p-4 text-sm text-destructive bg-destructive/15 rounded-md"
        >
          {errorMessage}
        </div>
      )}
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Nome
            </th>
            <th scope="col" className="px-6 py-3">
              Status
            </th>
            <th scope="col" className="px-6 py-3">
              Data
            </th>
            <th scope="col" className="px-6 py-3">
              Anexo
            </th>
            <th scope="col" className="px-6 py-3">
              Emissor
            </th>
            <th scope="col" className="px-6 py-3">
              CNPJ
            </th>
            <th scope="col" className="px-6 py-3">
              Valor Total
            </th>
            <th scope="col" className="px-6 py-3">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                Nenhuma solicitação encontrada.
              </td>
            </tr>
          ) : (
            requests.map((req) => {
              const currentStatus = REFUND_STATUS_MAP[req.status];
              return (
                <tr
                  key={req.id}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {req.requester_name}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={currentStatus?.badgeVariant ?? "default"}>
                      {currentStatus?.label ?? req.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {req.receipt_file_url ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReceiptUrl(req.receipt_file_url);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-lg text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Ver anexo"
                      >
                        <Eye className="size-4" />
                      </button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{req.issuer_name || "-"}</td>
                  <td className="px-6 py-4">{req.issuer_cnpj || "-"}</td>
                  <td className="px-6 py-4">
                    {req.total_value !== null && req.total_value !== undefined
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(req.total_value)
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    {req.status === "PENDING" ? (
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleProcess(req.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {processingId === req.id && (
                          <Loader2 className="size-3.5 animate-spin" />
                        )}
                        Aprovar para Leitura
                      </button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReceiptUrl(null);
        }}
        receiptUrl={selectedReceiptUrl}
      />
    </div>
  );
}
