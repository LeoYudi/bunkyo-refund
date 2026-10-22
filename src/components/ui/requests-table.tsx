"use client";

import {
  CheckCircle,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import {
  processBatchReceiptsAction,
  processReceiptAction,
} from "@/actions/ai.actions";
import {
  exportToCsvAction,
  sendBatchPaymentEmailAction,
} from "@/actions/batch.actions";
import { REFUND_STATUS_MAP, type RefundRequest } from "@/models/refund.model";
import { Badge } from "./badge";
import {
  type BatchEmailMetadata,
  BatchPaymentDialog,
} from "./batch-payment-dialog";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ReceiptModal } from "./receipt-modal";

export type { RefundRequest };

export interface RequestsTableProps {
  requests: RefundRequest[];
  onProcessRequest?: (requestId: string) => Promise<void> | void;
  onProcessBatch?: (requestIds: string[]) => Promise<void> | void;
  onConfirmBatch?: (
    selectedRequests: RefundRequest[],
    recipientEmail?: string,
    cc?: string,
    bcc?: string,
    metadata?: BatchEmailMetadata,
  ) => void | Promise<void>;
  onExportCsv?: (requestIds: string[]) => Promise<void> | void;
}

export function RequestsTable({
  requests,
  onProcessRequest,
  onProcessBatch,
  onConfirmBatch,
  onExportCsv,
}: RequestsTableProps) {
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);

  const selectableRequests = requests.filter(
    (r) => r.status === "PENDING" || r.status === "APPROVED",
  );
  const hasSelectableRequests = selectableRequests.length > 0;
  const allSelectableSelected =
    hasSelectableRequests &&
    selectableRequests.every((r) => selectedIds.includes(r.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(selectableRequests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const selectedPendingIds = selectedIds.filter(
    (id) => requests.find((r) => r.id === id)?.status === "PENDING",
  );
  const selectedApprovedRequests = requests.filter(
    (r) => selectedIds.includes(r.id) && r.status === "APPROVED",
  );

  const handleProcessBatch = async () => {
    if (selectedPendingIds.length === 0) return;
    setIsBatchProcessing(true);
    setErrorMessage(null);
    try {
      let result: { success: boolean; error?: string } | undefined;
      if (onProcessBatch) {
        await onProcessBatch(selectedPendingIds);
      } else {
        result = await processBatchReceiptsAction(selectedPendingIds);
      }
      if (result && !result.success) {
        setErrorMessage(
          result.error || "Erro ao processar solicitações em lote",
        );
      } else {
        setSelectedIds((prev) =>
          prev.filter((id) => !selectedPendingIds.includes(id)),
        );
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleExportCsv = async () => {
    if (selectedIds.length === 0) return;
    setIsExportingCsv(true);
    setErrorMessage(null);
    try {
      if (onExportCsv) {
        await onExportCsv(selectedIds);
      } else {
        const result = await exportToCsvAction(selectedIds);
        if (
          result.success &&
          result.csv &&
          typeof URL.createObjectURL === "function"
        ) {
          const blob = new Blob([result.csv], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `reembolsos_${new Date().toISOString().slice(0, 10)}.csv`,
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (!result.success) {
          setErrorMessage(result.error || "Erro ao exportar CSV");
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleConfirmBatch = async (
    selectedReqs: RefundRequest[],
    recipientEmail?: string,
    cc?: string,
    bcc?: string,
  ) => {
    setErrorMessage(null);
    try {
      if (onConfirmBatch) {
        await onConfirmBatch(selectedReqs, recipientEmail, cc, bcc);
      } else {
        const result = await sendBatchPaymentEmailAction(
          selectedReqs.map((r) => r.id),
          recipientEmail,
          cc,
          bcc,
        );
        if (result.success) {
          const sentIds = selectedReqs.map((r) => r.id);
          setSelectedIds((prev) => prev.filter((id) => !sentIds.includes(id)));
        } else {
          setErrorMessage(result.error || "Erro ao enviar pagamentos em lote");
          throw new Error(result.error || "Erro ao enviar pagamentos em lote");
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setErrorMessage(msg);
      throw error;
    }
  };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedIds.length} selecionado(s)
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={selectedIds.length === 0 || isExportingCsv}
            onClick={handleExportCsv}
          >
            {isExportingCsv && (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            )}
            <Download className="size-4 mr-1.5" />
            Exportar CSV
          </Button>
          <Button
            type="button"
            disabled={selectedPendingIds.length === 0 || isBatchProcessing}
            onClick={handleProcessBatch}
          >
            {isBatchProcessing && (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            )}
            Aprovar para Leitura em Lote
          </Button>
          <Button
            type="button"
            disabled={selectedApprovedRequests.length === 0}
            onClick={() => setIsBatchDialogOpen(true)}
          >
            Enviar Pagamentos em Lote
          </Button>
        </div>
      </div>

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
              <th scope="col" className="px-6 py-3 w-12">
                <input
                  type="checkbox"
                  aria-label="Selecionar todas as solicitações aprovadas"
                  disabled={!hasSelectableRequests}
                  checked={allSelectableSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700"
                />
              </th>
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
                const isSelectable =
                  req.status === "PENDING" || req.status === "APPROVED";
                const isSelected = selectedIds.includes(req.id);
                const hasReceipt = Boolean(req.receipt_file_url);
                const canProcess = req.status === "PENDING";
                const hasActions = hasReceipt || canProcess;
                return (
                  <tr
                    key={req.id}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <td className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar solicitação de ${req.requester_name}`}
                        disabled={!isSelectable}
                        checked={isSelected}
                        onChange={(e) =>
                          handleSelectOne(req.id, e.target.checked)
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50"
                      />
                    </td>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={!hasActions || processingId === req.id}
                          aria-label={`Abrir menu de ações para ${req.requester_name}`}
                          className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:pointer-events-none disabled:opacity-50"
                        >
                          {processingId === req.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="size-4" />
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {hasReceipt && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedReceiptUrl(req.receipt_file_url);
                                setIsModalOpen(true);
                              }}
                            >
                              <Eye className="size-4" />
                              Visualizar Nota Fiscal
                            </DropdownMenuItem>
                          )}
                          {canProcess && (
                            <DropdownMenuItem
                              disabled={processingId === req.id}
                              onClick={() => handleProcess(req.id)}
                            >
                              <CheckCircle className="size-4" />
                              Aprovar para Leitura
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

        <BatchPaymentDialog
          isOpen={isBatchDialogOpen}
          onClose={() => setIsBatchDialogOpen(false)}
          selectedRequests={selectedApprovedRequests}
          onConfirm={handleConfirmBatch}
        />
      </div>
    </div>
  );
}
