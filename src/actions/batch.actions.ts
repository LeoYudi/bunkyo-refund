"use server";

import { Resend } from "resend";
import { RefundBatchEmail } from "../components/emails/refund-batch-email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBatchPaymentEmailAction(date: string, totalValue: number) {
  try {
    await resend.emails.send({
      from: "finance@bunkyo.com",
      to: "admin@bunkyo.com",
      subject: `Pedido de Reembolsos - ${date}`,
      react: RefundBatchEmail({ date, totalValue }),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function exportToCsvAction(ids: string[]) {
  // Mock logic to export
  return { success: true, csv: "id,name\n1,test" };
}
