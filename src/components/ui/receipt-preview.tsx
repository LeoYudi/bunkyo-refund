"use client";

import { Check, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReceiptPreviewProps {
  file: File;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ReceiptPreview({
  file,
  onConfirm,
  onCancel,
  className,
  disabled,
}: ReceiptPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file?.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex flex-col items-center justify-center p-6 gap-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-2 rounded-xl bg-muted/50 ring-1 ring-border">
            {file.type.startsWith("image/") && previewUrl ? (
              // biome-ignore lint/performance/noImgElement: Blob URLs cannot be effectively optimized by Next.js Image component
              <img
                src={previewUrl}
                alt="Preview do comprovante"
                className="size-32 rounded-lg object-cover"
              />
            ) : (
              <div className="size-32 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="size-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground break-all px-4">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 w-full gap-3 mt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={disabled}
          >
            <X className="size-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            className="w-full"
            onClick={onConfirm}
            disabled={disabled}
          >
            <Check className="size-4 mr-2" />
            Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
