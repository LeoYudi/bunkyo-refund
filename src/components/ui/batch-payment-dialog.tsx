import React from "react";
import type { RefundRequest } from "@/models/refund.model";
import type { EmailSettings } from "@/models/settings.model";
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
  defaultSettings?: EmailSettings;
  onConfirm?: (
    selectedRequests: RefundRequest[],
    recipientEmail?: string,
    cc?: string,
    bcc?: string,
    metadata?: BatchEmailMetadata & {
      greetingText?: string;
      introTextTemplate?: string;
      spreadsheetText?: string;
      approvalRequestText?: string;
      closingText?: string;
      senderEmail?: string;
    },
  ) => void | Promise<void>;
}

export function BatchPaymentDialog({
  isOpen,
  onClose,
  selectedRequests = [],
  defaultSettings,
  onConfirm,
}: BatchPaymentDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [recipientEmail, setRecipientEmail] = React.useState(
    defaultSettings?.recipient_email ?? "",
  );
  const [ccEmail, setCcEmail] = React.useState(defaultSettings?.cc_email ?? "");
  const [bccEmail, setBccEmail] = React.useState(
    defaultSettings?.bcc_email ?? "",
  );
  const [pixByRequester, setPixByRequester] = React.useState<
    Record<string, string>
  >({});
  const [subject, setSubject] = React.useState(
    defaultSettings?.subject_prefix ?? "",
  );
  const [eventDescription, setEventDescription] = React.useState(
    defaultSettings?.default_event_description ?? "",
  );
  const [approverEmail, setApproverEmail] = React.useState(
    defaultSettings?.approver_email ?? "jaque.hanaoka@gmail.com",
  );
  const [senderName, setSenderName] = React.useState(
    defaultSettings?.sender_name ?? "Lucas Tamanaha",
  );
  const [senderRole, setSenderRole] = React.useState(
    defaultSettings?.sender_role ??
      "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
  );
  const [senderEmail, setSenderEmail] = React.useState(
    defaultSettings?.sender_email ?? "jovens@bunkyo.org.br",
  );
  const [senderPhone, setSenderPhone] = React.useState(
    defaultSettings?.sender_phone ?? "(16) 99332-8607",
  );

  React.useEffect(() => {
    if (!isOpen || !defaultSettings) return;
    setRecipientEmail(defaultSettings.recipient_email ?? "");
    setCcEmail(defaultSettings.cc_email ?? "");
    setBccEmail(defaultSettings.bcc_email ?? "");
    setSubject(defaultSettings.subject_prefix ?? "");
    setEventDescription(defaultSettings.default_event_description ?? "");
    setApproverEmail(
      defaultSettings.approver_email ?? "jaque.hanaoka@gmail.com",
    );
    setSenderName(defaultSettings.sender_name ?? "Lucas Tamanaha");
    setSenderRole(
      defaultSettings.sender_role ??
        "Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026",
    );
    setSenderEmail(defaultSettings.sender_email ?? "jovens@bunkyo.org.br");
    setSenderPhone(defaultSettings.sender_phone ?? "(16) 99332-8607");
  }, [isOpen, defaultSettings]);

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

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
      const metadataPayload: BatchEmailMetadata & {
        greetingText?: string;
        introTextTemplate?: string;
        spreadsheetText?: string;
        approvalRequestText?: string;
        closingText?: string;
        senderEmail?: string;
      } = {
        subject,
        eventDescription,
        approverEmail,
        pixByRequester,
        senderName,
        senderRole,
        senderEmail,
        senderPhone,
      };

      if (defaultSettings) {
        metadataPayload.greetingText = defaultSettings.greeting_text;
        metadataPayload.introTextTemplate = defaultSettings.intro_text_template;
        metadataPayload.spreadsheetText = defaultSettings.spreadsheet_text;
        metadataPayload.approvalRequestText =
          defaultSettings.approval_request_text;
        metadataPayload.closingText = defaultSettings.closing_text;
      }

      await onConfirm(
        selectedRequests,
        recipientEmail,
        ccEmail,
        bccEmail,
        metadataPayload,
      );
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cc-email">Cc (Cópia)</Label>
              <Input
                id="cc-email"
                type="email"
                placeholder="Cc"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bcc-email">Cco (Cópia Oculta)</Label>
              <Input
                id="bcc-email"
                type="email"
                placeholder="Cco"
                value={bccEmail}
                onChange={(e) => setBccEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-subject">Assunto</Label>
            <Input
              id="batch-subject"
              placeholder="Reembolso CJB - "
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Descrição do Evento</Label>
            <Input
              id="event-description"
              placeholder="Ex: gastos com baiten do DFI 2026"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="approver-email">
              E-mail para Aprovação / Menção
            </Label>
            <Input
              id="approver-email"
              type="email"
              value={approverEmail}
              onChange={(e) => setApproverEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender-email-input">E-mail na Assinatura</Label>
              <Input
                id="sender-email-input"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
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

          <div className="border rounded-md p-3 space-y-3 bg-muted/30 text-sm">
            <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Resumo do Lote ({count} {count === 1 ? "item" : "itens"})
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {groups.map((g) => (
                <div
                  key={g.requesterName}
                  className="space-y-1 pb-2 border-b last:border-0"
                >
                  <div className="flex justify-between font-medium">
                    <span>{g.requesterName}</span>
                    <span>{currencyFormatter.format(g.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`pix-${g.requesterName}`}
                      className="text-xs text-muted-foreground"
                    >
                      PIX de {g.requesterName}
                    </Label>
                    <Input
                      id={`pix-${g.requesterName}`}
                      className="h-7 text-xs"
                      placeholder="Chave PIX do colaborador"
                      value={pixByRequester[g.requesterName] || ""}
                      onChange={(e) =>
                        setPixByRequester((prev) => ({
                          ...prev,
                          [g.requesterName]: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Valor Total do Lote:</span>
              <span>{currencyFormatter.format(totalSum)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || count === 0}
          >
            {isConfirming ? "Enviando e-mail..." : "Confirmar Envio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
