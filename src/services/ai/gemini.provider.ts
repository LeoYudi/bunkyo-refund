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

    const DEFAULT_GEMINI_MODELS = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
    ];

    const envModels = process.env.GEMINI_MODELS;
    const models = envModels
      ? envModels
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
      : [];
    const activeModels = models.length > 0 ? models : DEFAULT_GEMINI_MODELS;

    const errors: string[] = [];

    for (const model of activeModels) {
      try {
        const interaction = await ai.interactions.create({
          model,
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
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        errors.push(`[${model}]: ${errMessage}`);
      }
    }

    throw new Error(`Todos os modelos Gemini falharam: ${errors.join(" | ")}`);
  }
}
