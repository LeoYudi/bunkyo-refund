"use client";

import { Download } from "lucide-react";
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
  const isImage =
    receiptUrl !== null &&
    (/\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(receiptUrl) ||
      receiptUrl.startsWith("data:image/"));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[92vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30 shrink-0 relative pr-24">
          <DialogTitle>Visualização de Comprovante</DialogTitle>
          <DialogDescription className="sr-only">
            Visualize a nota fiscal ou comprovante anexado.
          </DialogDescription>
          {!!receiptUrl && (
            <a
              href={receiptUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Baixar comprovante"
              className="absolute right-12 top-2.5 inline-flex items-center justify-center rounded-md p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
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
