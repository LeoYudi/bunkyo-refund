"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { updateRefundRequestAction } from "@/actions/refund.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RefundRequest, UpdateRefundInput } from "@/models/refund.model";

interface EditRefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: RefundRequest | null;
  onConfirm?: (payload: UpdateRefundInput) => void;
}

export function EditRefundDialog({
  isOpen,
  onClose,
  request,
  onConfirm,
}: EditRefundDialogProps) {
  const [requesterName, setRequesterName] = useState("");
  const [issuerName, setIssuerName] = useState("");
  const [issuerCnpj, setIssuerCnpj] = useState("");
  const [receiverCnpj, setReceiverCnpj] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (request) {
      setRequesterName(request.requester_name || "");
      setIssuerName(request.issuer_name || "");
      setIssuerCnpj(request.issuer_cnpj || "");
      setReceiverCnpj(request.receiver_cnpj || "");
      setTotalValue(
        request.total_value !== null && request.total_value !== undefined
          ? String(request.total_value)
          : "",
      );
      setIssueDate(request.issue_date || "");
      setIssueNumber(request.issue_number || "");
      setDescription(request.description || "");
      setError(null);
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const payload: UpdateRefundInput = {
      requester_name: requesterName,
      issuer_name: issuerName || null,
      issuer_cnpj: issuerCnpj || null,
      receiver_cnpj: receiverCnpj || null,
      total_value: totalValue ? Number(totalValue) : null,
      issue_date: issueDate || null,
      issue_number: issueNumber || null,
      description: description || null,
    };

    if (onConfirm) {
      onConfirm(payload);
      setIsLoading(false);
      onClose();
      return;
    }

    try {
      const res = await updateRefundRequestAction(request.id, payload);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Solicitação de Reembolso</DialogTitle>
          <DialogDescription>
            Atualize os dados da solicitação de reembolso abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="requester_name">Nome do Solicitante</Label>
            <Input
              id="requester_name"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuer_name">Nome do Emissor</Label>
              <Input
                id="issuer_name"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_number">Número da Nota</Label>
              <Input
                id="issue_number"
                value={issueNumber}
                onChange={(e) => setIssueNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuer_cnpj">CNPJ do Emissor</Label>
              <Input
                id="issuer_cnpj"
                value={issuerCnpj}
                onChange={(e) => setIssuerCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiver_cnpj">CNPJ do Tomador</Label>
              <Input
                id="receiver_cnpj"
                value={receiverCnpj}
                onChange={(e) => setReceiverCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_value">Valor Total (R$)</Label>
              <Input
                id="total_value"
                type="number"
                step="0.01"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_date">Data de Emissão</Label>
              <Input
                id="issue_date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
