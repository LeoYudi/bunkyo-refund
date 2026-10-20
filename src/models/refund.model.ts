import { z } from "zod";
import type { Database } from "@/models/database.types";

export type RefundRequest =
  Database["public"]["Tables"]["refund_requests"]["Row"];

export const RefundStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "APPROVED",
  "DENIED",
  "SENT",
  "PAID",
]);

export const CreateRefundSchema = z.object({
  requester_name: z.string().min(2),
  receipt_file_url: z.string().url(),
});

const cnpjRegex = /^(?:\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})$/;

export const UpdateRefundSchema = z.object({
  status: RefundStatusSchema.optional(),
  issuer_name: z.string().optional(),
  issuer_cnpj: z.string().regex(cnpjRegex).optional(),
  receiver_cnpj: z.string().regex(cnpjRegex).optional(),
  total_value: z.number().positive().optional(),
  issue_date: z.string().date().optional(),
  issue_number: z.string().optional(),
  description: z.string().optional(),
});

export const RefundSchema = z.object({
  id: z.string().uuid(),
  requester_name: z.string().min(2),
  receipt_file_url: z.string().url(),
  status: RefundStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  reviewed_by: z.string().uuid().nullable().optional(),
  issuer_name: z.string().nullable().optional(),
  issuer_cnpj: z.string().regex(cnpjRegex).nullable().optional(),
  receiver_cnpj: z.string().regex(cnpjRegex).nullable().optional(),
  total_value: z.number().positive().nullable().optional(),
  issue_date: z.string().date().nullable().optional(),
  issue_number: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const ReceiptAIExtractionSchema = z.object({
  issuer_name: z.string().nullable(),
  issuer_cnpj: z.string().nullable(),
  receiver_cnpj: z.string().nullable(),
  total_value: z.number().nullable(),
  issue_date: z
    .string()
    .nullable()
    .transform((val) => {
      if (!val) return val;
      const match = val.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
      }
      return val;
    }),
  issue_number: z.string().nullable(),
  description: z.string().nullable(),
});

export type RefundStatus = z.infer<typeof RefundStatusSchema>;

export type RefundStatusBadgeVariant =
  | "pending"
  | "processing"
  | "approved"
  | "denied"
  | "sent"
  | "paid";

export interface RefundStatusMetadata {
  label: string;
  description: string;
  badgeVariant: RefundStatusBadgeVariant;
}

export const REFUND_STATUS_MAP: Record<RefundStatus, RefundStatusMetadata> = {
  PENDING: {
    label: "Pendente",
    description:
      "Recebido do formulário público e aguardando triagem do administrador.",
    badgeVariant: "pending",
  },
  PROCESSING: {
    label: "Processando",
    description: "Nota fiscal em leitura e extração de dados pela IA (Gemini).",
    badgeVariant: "processing",
  },
  APPROVED: {
    label: "Aprovado",
    description: "Dados extraídos e validados, pronto para envio em lote.",
    badgeVariant: "approved",
  },
  DENIED: {
    label: "Negado",
    description: "Pedido recusado ou invalidado na triagem.",
    badgeVariant: "denied",
  },
  SENT: {
    label: "Enviado",
    description: "Lote consolidado e encaminhado por e-mail ao financeiro.",
    badgeVariant: "sent",
  },
  PAID: {
    label: "Pago",
    description: "Reembolso efetuado e concluído pelo financeiro.",
    badgeVariant: "paid",
  },
};

export const REFUND_LIFECYCLE_STEPS: readonly RefundStatus[] = [
  "PENDING",
  "PROCESSING",
  "APPROVED",
  "SENT",
  "PAID",
];
