"use client";

import { useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string | null;
}

export function ReceiptModal({
  isOpen,
  onClose,
  receiptUrl,
}: ReceiptModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!receiptUrl) return;
    try {
      setIsDownloading(true);
      const response = await fetch(receiptUrl);
      if (!response.ok) throw new Error("Erro ao baixar o arquivo");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = receiptUrl.split("/").pop()?.split("?")[0] || "comprovante";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Falha no download:", error);
      // Fallback in case of CORS error
      window.open(receiptUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsDownloading(false);
    }
  };

  const isImage =
    receiptUrl !== null &&
    (/\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(receiptUrl) ||
      receiptUrl.startsWith("data:image/"));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl h-[92vh] flex flex-col overflow-hidden p-0 gap-0"
      >
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30 shrink-0 flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle>Visualização de Comprovante</DialogTitle>
            <DialogDescription className="sr-only">
              Visualize a nota fiscal ou comprovante anexado.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-1">
            {!!receiptUrl && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label="Baixar comprovante"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-muted/10">
          {receiptUrl ? (
            isImage ? (
              // biome-ignore lint/performance/noImgElement: External receipt URLs cannot be optimized by Next.js Image component statically
              <img
                src={receiptUrl}
                alt="Comprovante"
                className="w-full h-[80vh] object-contain rounded-md"
              />
            ) : (
              <iframe
                src={receiptUrl}
                className="w-full h-[80vh] rounded-md border border-border bg-background"
                title="Comprovante"
              />
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum comprovante disponível para visualização.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
