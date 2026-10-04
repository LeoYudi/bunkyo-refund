import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const receiptSchema = z.object({
  issuer_name: z.string().describe("Name of the issuer"),
  issuer_cnpj: z.string().describe("CNPJ of the issuer"),
  receiver_cnpj: z.string().describe("CNPJ of the receiver"),
  total_value: z.number().describe("Total value of the receipt"),
  issue_date: z.string().describe("Date of issue in YYYY-MM-DD format"),
  issue_number: z.string().describe("Issue number of the receipt"),
  description: z.string().describe("Description of the receipt"),
});

export async function processReceiptWithGemini(fileUrl: string) {
  // Assuming fileUrl is a public URL we can fetch or pass to Gemini
  // For now, in a real scenario we'd download the file and pass it as base64
  // We'll mock the fetch for simplicity if needed, but let's implement the prompt
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: `Extraia as informações desta nota fiscal (disponível na URL: ${fileUrl}). Retorne apenas JSON.` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: receiptSchema,
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text);
}
