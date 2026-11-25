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
  const [pixByRequester, setPixByRequester] = React.useState<
    Record<string, string>
  >({});
  const [subject, setSubject] = React.useState("");
  const [eventDescription, setEventDescription] = React.useState("");
  const [approverEmail, setApproverEmail] = React.useState(
    "jaque.hanaoka@gmail.com",
  );
  const [senderName, setSenderName] = React.useState("Lucas Tamanaha");
  const [senderRole, setSenderRole] = React.useState(
    "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
  );
  const [senderPhone, setSenderPhone] = React.useState("(16) 99332-8607");

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Group selectedRequests by requester_name keeping order of appearance
  const groups: Array<{
    requesterName: string;
    totalAmount: number;
    count: number;
  }> = [];
  for (const req of selectedRequests) {
    const name = req.requester_name;
    const val = req.total_value ?? 0;
    const existing = groups.find((g) => g.requesterName === name);
    if (existing) {
      existing.totalAmount += val;
      existing.count += 1;
    } else {
      groups.push({ requesterName: name, totalAmount: val, count: 1 });
    }
  }

  const totalSum = selectedRequests.reduce(
    (acc, req) => acc + (req.total_value ?? 0),
    0,
  );

  const handleConfirm = async () => {
    if (!onConfirm) {
      onClose();
      return;
    }
    try {
      setIsConfirming(true);
      await onConfirm(selectedRequests, recipientEmail, ccEmail, bccEmail, {
        subject,
        eventDescription,
        approverEmail,
        pixByRequester,
        senderName,
        senderRole,
        senderPhone,
      });
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Enviar Pagamentos em Lote</DialogTitle>
          <DialogDescription>{countText}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto max-h-[75vh] pr-1">
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

          <div className="space-y-2">
            <Label htmlFor="email-subject">Assunto do E-mail</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Reembolso CJB - DFI 2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">
              Descrição do Evento / Gastos
            </Label>
            <Input
              id="event-description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Ex: gastos com baiten do DFI 2026 que ocorreu nos dias 26 e 27/09/2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="approver-email">
              E-mail para Aprovação (@Menção)
            </Label>
            <Input
              id="approver-email"
              type="email"
              value={approverEmail}
              onChange={(e) => setApproverEmail(e.target.value)}
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              Solicitantes e Chaves PIX
            </h4>
            {groups.map((group) => (
              <div
                key={group.requesterName}
                className="space-y-1.5 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {group.requesterName}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">
                    {currencyFormatter.format(group.totalAmount)}
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <Label
                    htmlFor={`pix-${group.requesterName}`}
                    className="sr-only"
                  >
                    PIX de {group.requesterName}
                  </Label>
                  <Input
                    id={`pix-${group.requesterName}`}
                    placeholder="Chave PIX (CPF, CNPJ, celular, aleatória)"
                    value={pixByRequester[group.requesterName] ?? ""}
                    onChange={(e) =>
                      setPixByRequester((prev) => ({
                        ...prev,
                        [group.requesterName]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              Assinatura do E-mail
            </h4>
            <div className="space-y-2">
              <Label htmlFor="sender-name">Nome na Assinatura</Label>
              <Input
                id="sender-name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender-role">Cargo na Assinatura</Label>
              <Input
                id="sender-role"
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender-phone">Telefone na Assinatura</Label>
              <Input
                id="sender-phone"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white shrink-0">
          <span>Valor Total Geral</span>
          <span>{currencyFormatter.format(totalSum)}</span>
        </div>

        <DialogFooter className="sm:justify-end gap-2 shrink-0">
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
