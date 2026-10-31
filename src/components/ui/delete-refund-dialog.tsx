"use client";

import { useState } from "react";
import { deleteRefundRequestAction } from "@/actions/refund.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RefundRequest } from "@/models/refund.model";

interface DeleteRefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: RefundRequest | null;
  onConfirm?: () => void;
}

export function DeleteRefundDialog({
  isOpen,
  onClose,
  request,
  onConfirm,
}: DeleteRefundDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleDelete = async () => {
    setError(null);
    setIsLoading(true);

    if (onConfirm) {
      onConfirm();
      setIsLoading(false);
      onClose();
      return;
    }

    try {
      const res = await deleteRefundRequestAction(request.id);
      if (!res.success) {
        setError(res.error);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const isSent = request.status === "SENT";
  const isPaid = request.status === "PAID";
  const formattedValue =
    request.total_value !== null && request.total_value !== undefined
      ? request.total_value.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : "R$ 0,00";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Solicitação de Reembolso</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir esta solicitação? Esta ação é
            irreversível e permanente e não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
            <p>
              <strong className="font-medium">Solicitante:</strong>{" "}
              {request.requester_name}
            </p>
            <p>
              <strong className="font-medium">Valor:</strong> {formattedValue}
            </p>
            <p>
              <strong className="font-medium">Status:</strong> {request.status}
            </p>
          </div>

          {isSent && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 text-sm">
              <span>
                Esta solicitação já foi enviada ao financeiro. Excluí-la pode
                gerar inconsistência nos lotes enviados.
              </span>
            </div>
          )}

          {isPaid && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-800 dark:text-emerald-300 text-sm">
              <span>
                Esta solicitação já foi paga/concluída. A exclusão de registros
                pagos afeta o histórico contábil.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
