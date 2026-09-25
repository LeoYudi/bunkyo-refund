"use client";

import { submitRefundRequest } from "@/actions/refund.actions";
import { uploadReceipt } from "@/actions/upload.action";
import { SubmitRefundForm } from "@/components/forms/submit-refund-form";

export default function SubmitPage() {
  const handleSubmitAction = async (formData: FormData) => {
    try {
      const file = formData.get("file") as File;
      const requester_name = formData.get("requester_name") as string;

      if (!file || !requester_name) {
        return { success: false, error: "Dados incompletos" };
      }

      // 1. Upload the file to storage
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const uploadUrl = await uploadReceipt(uploadFormData);

      // 2. Insert the record into the database
      const result = await submitRefundRequest({
        requester_name,
        receipt_file_url: uploadUrl,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Erro ao salvar solicitação",
        };
      }

      // In the future, this will redirect to /submit/success
      // For now, let's just return success so the form knows it worked.
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao processar solicitação",
      };
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Solicitar Reembolso
          </h1>
          <p className="text-muted-foreground">
            Envie seu comprovante e receba seu reembolso rapidamente.
          </p>
        </div>

        <SubmitRefundForm onSubmitAction={handleSubmitAction} />
      </div>
    </main>
  );
}
