import React from "react";
import type { RefundRequest } from "@/models/refund.model";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

export interface BatchPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests?: RefundRequest[];
  onConfirm?: (selectedRequests: RefundRequest[]) => void | Promise<void>;
}

export function BatchPaymentDialog({
  isOpen,
  onClose,
  selectedRequests = [],
  onConfirm,
}: BatchPaymentDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const totalSum = selectedRequests.reduce(
    (acc, req) => acc + (req.total_value ?? 0),
    0,
  );

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const handleConfirm = async () => {
    if (!onConfirm) {
      onClose();
      return;
    }
    try {
      setIsConfirming(true);
      await onConfirm(selectedRequests);
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const count = selectedRequests.length;
  const countText =
    count === 1
      ? "1 solicitação selecionada"
      : `${count} solicitações selecionadas`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Pagamentos em Lote</DialogTitle>
          <DialogDescription>{countText}</DialogDescription>
        </DialogHeader>

        <div className="max-h-60 overflow-y-auto space-y-3 py-2 pr-1">
          {selectedRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-800"
            >
              <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                {req.requester_name}
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                {currencyFormatter.format(req.total_value ?? 0)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
          <span>Valor Total Geral</span>
          <span>{currencyFormatter.format(totalSum)}</span>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming || count === 0}
          >
            {isConfirming ? "Enviando..." : "Confirmar Envio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
