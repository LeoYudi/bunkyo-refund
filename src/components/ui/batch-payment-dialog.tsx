import React from "react";
import type { RefundRequest } from "@/models/refund.model";
import type { BatchEmailMetadata } from "@/services/email.service";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

export type { BatchEmailMetadata };

export interface BatchPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests?: RefundRequest[];
  onConfirm?: (
    selectedRequests: RefundRequest[],
    recipientEmail?: string,
    cc?: string,
    bcc?: string,
    metadata?: BatchEmailMetadata,
  ) => void | Promise<void>;
}

export function BatchPaymentDialog({
  isOpen,
  onClose,
  selectedRequests = [],
  onConfirm,
}: BatchPaymentDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [ccEmail, setCcEmail] = React.useState("");
  const [bccEmail, setBccEmail] = React.useState("");

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
      await onConfirm(selectedRequests, recipientEmail, ccEmail, bccEmail);
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

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="recipient-email">
              E-mail do Financeiro (opcional)
            </Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="E-mail do destinatário (financeiro@bunkyo.org.br)"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-email">Cc (Cópia)</Label>
            <Input
              id="cc-email"
              type="text"
              placeholder="Ex: gestor@bunkyo.org.br, fiscal@bunkyo.org.br"
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bcc-email">Cco (Cópia Oculta)</Label>
            <Input
              id="bcc-email"
              type="text"
              placeholder="Ex: diretoria@bunkyo.org.br"
              value={bccEmail}
              onChange={(e) => setBccEmail(e.target.value)}
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
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
