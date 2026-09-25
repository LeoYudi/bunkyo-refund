"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { ReceiptPreview } from "@/components/ui/receipt-preview";
import { ReceiptUploader } from "@/components/ui/receipt-uploader";
import { cn } from "@/lib/utils";

export const SubmitRefundFormSchema = z.object({
  requester_name: z
    .string()
    .min(2, "O nome completo deve ter pelo menos 2 caracteres"),
  file: z
    .instanceof(File, { message: "Selecione um comprovante válido" })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "O arquivo deve ter no máximo 5MB",
    })
    .refine(
      (file) =>
        ["application/pdf", "image/png", "image/jpg", "image/jpeg"].includes(
          file.type,
        ),
      {
        message: "Formato de arquivo inválido",
      },
    )
    .optional(),
});

export type SubmitRefundFormValues = z.infer<typeof SubmitRefundFormSchema>;

export interface SubmitRefundFormProps {
  onSubmitAction: (
    formData: FormData,
  ) => Promise<{ success: boolean; error?: string }>;
  className?: string;
}

export function SubmitRefundForm({
  onSubmitAction,
  className,
}: SubmitRefundFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SubmitRefundFormValues>({
    resolver: zodResolver(SubmitRefundFormSchema),
    defaultValues: {
      requester_name: "",
      file: undefined,
    },
  });

  const file = form.watch("file");

  const onSubmit = async (data: SubmitRefundFormValues) => {
    if (!data.file) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      const formData = new FormData();
      formData.append("requester_name", data.requester_name);
      formData.append("file", data.file);

      const result = await onSubmitAction(formData);
      if (!result.success && result.error) {
        setServerError(result.error);
      }
    } catch (error: unknown) {
      setServerError(
        error instanceof Error ? error.message : "Erro ao enviar solicitação",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("space-y-6 w-full", className)}
    >
      <div className="space-y-2">
        <label
          htmlFor="requester_name"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Nome Completo
        </label>
        <Input
          id="requester_name"
          placeholder="Digite seu nome completo"
          disabled={isSubmitting}
          {...form.register("requester_name")}
        />
        {form.formState.errors.requester_name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.requester_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {!file ? (
          <ReceiptUploader
            selectedFile={file}
            onFileSelect={(selectedFile) => {
              form.setValue("file", selectedFile, { shouldValidate: true });
            }}
          />
        ) : (
          <ReceiptPreview
            file={file}
            disabled={isSubmitting}
            onCancel={() => {
              form.setValue("file", undefined, { shouldValidate: true });
            }}
            onConfirm={form.handleSubmit(onSubmit)}
          />
        )}
        {form.formState.errors.file && (
          <p className="text-xs text-destructive">
            {form.formState.errors.file.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-sm font-medium text-destructive">{serverError}</p>
      )}
    </form>
  );
}
