import { z } from "zod";

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
