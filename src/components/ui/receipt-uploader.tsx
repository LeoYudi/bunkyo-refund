"use client";

import { FileText, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ReceiptUploaderProps {
  onFileSelect?: (file: File) => void;
  className?: string;
  selectedFile?: File | null;
}

export function ReceiptUploader({
  onFileSelect,
  className,
  selectedFile,
}: ReceiptUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
        // Validação simples do tipo
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          onFileSelect?.(file);
        }
      }
    },
    [onFileSelect],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect?.(e.target.files[0]);
      }
    },
    [onFileSelect],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    // biome-ignore lint/a11y/useSemanticElements: This is a complex dropzone area, not a simple button
    <div
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
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 bg-background",
        className,
      )}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="p-3 rounded-full bg-muted text-muted-foreground">
          {selectedFile ? (
            <FileText className="size-6 text-primary" />
          ) : (
            <Upload className="size-6" />
          )}
        </div>
        {selectedFile ? (
          <div>
            <p className="text-sm font-medium text-foreground">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique ou arraste para substituir o arquivo
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">
              Arraste e solte o comprovante aqui, ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG ou PDF</p>
          </>
        )}
      </div>
    </div>
  );
}
