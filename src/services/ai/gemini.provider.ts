import { GoogleGenAI } from "@google/genai";
import type {
  AIExtractionInput,
  AIExtractionRawResult,
  AIProvider,
} from "./types";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  isConfigured(): boolean {
    return Boolean(
      process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim(),
    );
  }

  async extract(input: AIExtractionInput): Promise<AIExtractionRawResult> {
    const apiKey =
      process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "Gemini API key is not configured (GEMINI_API_KEY or GOOGLE_API_KEY).",
      );
    }

    const { base64Data, mimeType, prompt } = input;
    const ai = new GoogleGenAI({ apiVersion: "v1beta" });

    const fileInputType = mimeType.startsWith("image/") ? "image" : "document";

    const response_format = {
      type: "text" as const,
      mime_type: "application/json",
      schema: {
        type: "object" as const,
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
    };

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: [
        {
          type: "text",
          text: prompt,
        },
        {
          type: fileInputType,
          data: base64Data,
          mime_type: mimeType,
        } as unknown as { type: "text"; text: string },
      ],
      response_format,
    });

    const outputText = interaction.output_text;
    if (!outputText?.trim()) {
      throw new Error("A IA não retornou nenhum texto.");
    }

    return {
      provider: "gemini",
      rawText: outputText,
    };
  }
}
