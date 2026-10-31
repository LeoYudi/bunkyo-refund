"use client";

import { FileText, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CameraCapture } from "./camera-capture";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface ReceiptUploaderProps {
  onFileSelect?: (file: File) => void;
  selectedFile?: File | null;
  className?: string;
}

export function ReceiptUploader({
  onFileSelect,
  selectedFile,
  className,
}: ReceiptUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = useCallback(
    (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(
          "O arquivo é muito grande. O tamanho máximo permitido é de 5MB.",
        );
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        return;
      }
      setFileError(null);
      onFileSelect?.(file);
    },
    [onFileSelect],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          validateAndSelectFile(file);
        }
      }
    },
    [validateAndSelectFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateAndSelectFile(e.target.files[0]);
      }
    },
    [validateAndSelectFile],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        role="button"
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed transition-colors duration-200 cursor-pointer overflow-hidden",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 bg-background",
        )}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center">
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="hidden"
          />
          <div className="p-4 rounded-full bg-muted/50 text-muted-foreground ring-1 ring-border">
            {selectedFile ? (
              <FileText className="size-8 text-primary" />
            ) : (
              <Upload className="size-8" />
            )}
          </div>

          {selectedFile ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Clique ou arraste para substituir o arquivo
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Arraste e solte o comprovante aqui
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou PDF (máx. 5MB)
              </p>
            </div>
          )}

          {!selectedFile && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                Selecionar arquivo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {fileError && (
        <p
          role="alert"
          className="text-xs font-medium text-destructive text-center"
        >
          {fileError}
        </p>
      )}

      {!selectedFile && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">
            Ou prefere tirar uma foto agora?
          </p>
          <CameraCapture onCapture={(file) => validateAndSelectFile(file)} />
        </div>
      )}
    </div>
  );
}
