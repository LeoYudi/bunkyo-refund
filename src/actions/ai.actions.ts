"use server";

import { processReceiptWithGemini } from "../services/ai.service";

export async function processReceiptAction(fileUrl: string) {
  try {
    const data = await processReceiptWithGemini(fileUrl);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
