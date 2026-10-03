"use client";

import { X } from "lucide-react";

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
  if (!isOpen) return null;

  const isImage =
    receiptUrl !== null &&
    (/\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(receiptUrl) ||
      receiptUrl.startsWith("data:image/"));

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop overlay click handler
    <div
      data-testid="modal-overlay"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0"
      onClick={onClose}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal container stops click propagation */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal container stops click propagation */}
      <div
        className="bg-background rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground">
            Visualização de Comprovante
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>
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
      </div>
    </div>
  );
}
