"use client";

import {
  Bot,
  CheckCircle,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  processBatchReceiptsAction,
  processReceiptAction,
} from "@/actions/ai.actions";
import {
  exportToCsvAction,
  sendBatchPaymentEmailAction,
} from "@/actions/batch.actions";
import {
  deleteBatchRefundRequestsAction,
  deleteRefundRequestAction,
  updateRefundRequestAction,
} from "@/actions/refund.actions";
import {
  REFUND_STATUS_MAP,
  type RefundRequest,
  type UpdateRefundInput,
} from "@/models/refund.model";
import type { EmailSettings } from "@/models/settings.model";
import { Badge } from "./badge";
import {
  type BatchEmailMetadata,
  BatchPaymentDialog,
} from "./batch-payment-dialog";
import { Button } from "./button";
import { DeleteRefundDialog } from "./delete-refund-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { EditRefundDialog } from "./edit-refund-dialog";
import { ReceiptModal } from "./receipt-modal";

export type { RefundRequest };

export interface RequestsTableProps {
  requests: RefundRequest[];
  defaultEmailSettings?: EmailSettings;
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
  onEditRequest?: (
    request: RefundRequest,
    payload: UpdateRefundInput,
  ) => void | Promise<void>;
  onDeleteRequest?: (requestId: string) => void | Promise<void>;
  onDeleteBatch?: (requestIds: string[]) => Promise<void> | void;
}

export function RequestsTable({
  requests,
  onProcessRequest,
  onProcessBatch,
  onConfirmBatch,
  onExportCsv,
  onEditRequest,
  onDeleteRequest,
  onDeleteBatch,
}: RequestsTableProps) {
  const router = useRouter();
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAiResponse, setSelectedAiResponse] = useState<string | null>(
    null,
  );
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);

  const [editingRequest, setEditingRequest] = useState<RefundRequest | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<RefundRequest | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const selectableRequests = requests;
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
    metadata?: BatchEmailMetadata,
  ) => {
    setErrorMessage(null);
    try {
      if (onConfirmBatch) {
        await onConfirmBatch(selectedReqs, recipientEmail, cc, bcc, metadata);
      } else {
        const args: [
          string[],
          string | undefined,
          string | undefined,
          string | undefined,
          BatchEmailMetadata?,
        ] = [selectedReqs.map((r) => r.id), recipientEmail, cc, bcc];
        if (
          metadata &&
          !(
            metadata.subject === "" &&
            metadata.eventDescription === "" &&
            metadata.approverEmail === "jaque.hanaoka@gmail.com" &&
            Object.keys(metadata.pixByRequester || {}).length === 0 &&
            metadata.senderName === "Lucas Tamanaha" &&
            metadata.senderRole ===
              "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026" &&
            metadata.senderPhone === "(16) 99332-8607"
          )
        ) {
          args.push(metadata);
        }
        const result = await sendBatchPaymentEmailAction(...args);
        if (result.success) {
          const sentIds = selectedReqs.map((r) => r.id);
          setSelectedIds((prev) => prev.filter((id) => !sentIds.includes(id)));
        } else {
          if (result.sessionExpired) {
            setErrorMessage(
              result.error ||
                "Sessão do Google expirada. Faça login novamente.",
            );
            router.push("/login?reason=google_session_expired");
            return;
          }
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

  const handleEditConfirm = async (payload: UpdateRefundInput) => {
    if (!editingRequest) return;
    if (onEditRequest) {
      await onEditRequest(editingRequest, payload);
    } else {
      const res = await updateRefundRequestAction(editingRequest.id, payload);
      if (!res.success) {
        throw new Error(res.error);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRequest) return;
    if (onDeleteRequest) {
      await onDeleteRequest(deletingRequest.id);
    } else {
      const res = await deleteRefundRequestAction(deletingRequest.id);
      if (!res.success) {
        throw new Error(res.error);
      }
    }
  };

  const handleDeleteBatch = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    setErrorMessage(null);
    try {
      if (onDeleteBatch) {
        await onDeleteBatch(selectedIds);
        setSelectedIds([]);
        setIsBulkDeleteDialogOpen(false);
      } else {
        const result = await deleteBatchRefundRequestsAction(selectedIds);
        if (result.success) {
          setSelectedIds([]);
          setIsBulkDeleteDialogOpen(false);
        } else {
          const succeededIds = result.data?.succeeded ?? [];
          if (succeededIds.length > 0) {
            setSelectedIds((prev) =>
              prev.filter((id) => !succeededIds.includes(id)),
            );
          }
          setErrorMessage(
            result.error || "Erro ao excluir solicitações em lote",
          );
          setIsBulkDeleteDialogOpen(false);
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setIsBulkDeleteDialogOpen(false);
    } finally {
      setIsBulkDeleting(false);
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
          <Button
            type="button"
            variant="destructive"
            disabled={selectedIds.length === 0 || isBulkDeleting}
            onClick={() => setIsBulkDeleteDialogOpen(true)}
          >
            {isBulkDeleting && (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            )}
            <Trash2 className="size-4 mr-1.5" />
            Excluir Selecionados
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
                  aria-label="Selecionar todas as solicitações"
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
                const isSelected = selectedIds.includes(req.id);
                const hasReceipt = Boolean(req.receipt_file_url);
                const hasAiResponse = Boolean(req.raw_ai_response?.trim());
                const canProcess = req.status === "PENDING";
                const hasActions = hasReceipt || hasAiResponse || canProcess;
                return (
                  <tr
                    key={req.id}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <td className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar solicitação de ${req.requester_name}`}
                        checked={isSelected}
                        onChange={(e) =>
                          handleSelectOne(req.id, e.target.checked)
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700"
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
                          {hasAiResponse && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAiResponse(
                                  req.raw_ai_response ?? null,
                                );
                                setIsAiModalOpen(true);
                              }}
                            >
                              <Bot className="size-4" />
                              Ver Retorno da IA
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
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingRequest(req);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                            Editar Solicitação
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setDeletingRequest(req);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="size-4" />
                            Excluir Solicitação
                          </DropdownMenuItem>
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

        <EditRefundDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingRequest(null);
          }}
          request={editingRequest}
          onConfirm={handleEditConfirm}
        />

        <DeleteRefundDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setDeletingRequest(null);
          }}
          request={deletingRequest}
          onConfirm={handleDeleteConfirm}
        />

        <Dialog
          open={isAiModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsAiModalOpen(false);
              setSelectedAiResponse(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retorno da IA (Gemini)</DialogTitle>
              <DialogDescription>
                Resposta bruta extraída pela inteligência artificial para esta
                solicitação.
              </DialogDescription>
            </DialogHeader>
            <pre className="p-4 rounded-lg bg-muted text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
              {selectedAiResponse}
            </pre>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAiModalOpen(false);
                  setSelectedAiResponse(null);
                }}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <BatchPaymentDialog
          isOpen={isBatchDialogOpen}
          onClose={() => setIsBatchDialogOpen(false)}
          selectedRequests={selectedApprovedRequests}
          onConfirm={handleConfirmBatch}
        />

        <Dialog
          open={isBulkDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open && !isBulkDeleting) {
              setIsBulkDeleteDialogOpen(false);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Excluir Solicitações em Lote</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir {selectedIds.length}{" "}
                solicitação(ões) selecionada(s)? Esta ação é permanente e
                irreversível e não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkDeleteDialogOpen(false)}
                disabled={isBulkDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteBatch}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
