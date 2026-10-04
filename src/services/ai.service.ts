import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { ReceiptAIExtractionSchema } from "@/models/refund.model";

export async function processReceiptWithAI(
  storagePath: string,
  mimeType: string,
) {
  const supabase = await createClient();
  const { data: fileData, error } = await supabase.storage
    .from("receipts")
    .download(storagePath);

  if (error || !fileData) {
    throw new Error("Falha ao baixar o arquivo do Supabase");
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");

  const fileInputType = mimeType.startsWith("image/") ? "image" : "document";

  const ai = new GoogleGenAI({});

  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: [
      {
        type: "text",
        text: "Extraia os dados da nota fiscal em anexo. Se um dado não existir, retorne null. Converta valores monetários para número real (padrão americano).",
      },
      {
        type: fileInputType,
        data: base64Data,
        mime_type: mimeType,
      },
    ],
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "object",
        properties: {
          issuer_name: { type: "string" },
          issuer_cnpj: { type: "string" },
          receiver_cnpj: { type: "string" },
          total_value: { type: "number" },
          issue_date: { type: "string" },
          issue_number: { type: "string" },
          description: { type: "string" },
        },
        required: [
          "issuer_name",
          "issuer_cnpj",
          "receiver_cnpj",
          "total_value",
          "issue_date",
          "issue_number",
          "description",
        ],
      },
    },
  });

  if (!interaction.output_text) {
    throw new Error("A IA não retornou nenhum texto.");
  }

  const rawData = JSON.parse(interaction.output_text);
  const validatedData = ReceiptAIExtractionSchema.parse(rawData);

  return validatedData;
}
