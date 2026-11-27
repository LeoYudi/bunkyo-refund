import { createClient } from "@/lib/supabase/server";
import { ReceiptAIExtractionSchema } from "@/models/refund.model";
import { GeminiProvider } from "./ai/gemini.provider";
import { MistralAIProvider } from "./ai/mistral.provider";
import { OpenRouterProvider } from "./ai/openrouter.provider";
import type { AIProvider } from "./ai/types";

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

  const prompt =
    "Extraia os dados da nota fiscal em anexo. Se um dado não existir, retorne null. Converta valores monetários para número real (padrão americano) e datas para o formato ISO YYYY-MM-DD.";

  const allProviders: Record<string, AIProvider> = {
    mistral: new MistralAIProvider(),
    openrouter: new OpenRouterProvider(),
    gemini: new GeminiProvider(),
  };

  const defaultOrder = ["mistral", "openrouter", "gemini"];
  const orderEnv = process.env.AI_PROVIDER_ORDER?.trim();
  const order = orderEnv
    ? orderEnv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : defaultOrder;

  const configuredProviders = order
    .map((name) => allProviders[name])
    .filter((p): p is AIProvider => Boolean(p?.isConfigured()));

  if (configuredProviders.length === 0) {
    throw new Error("Nenhum provedor de IA está configurado.");
  }

  const errors: string[] = [];

  for (const provider of configuredProviders) {
    try {
      const { rawText } = await provider.extract({
        base64Data,
        mimeType,
        prompt,
      });

      let rawData: unknown;
      try {
        rawData = JSON.parse(rawText);
      } catch (parseErr: unknown) {
        const parseMessage =
          parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`Invalid JSON response: ${parseMessage}`);
      }

      const validatedData = ReceiptAIExtractionSchema.parse(rawData);

      let issueDate = validatedData.issue_date;
      if (issueDate && /^\d{2}\/\d{2}\/\d{4}$/.test(issueDate)) {
        const [d, m, y] = issueDate.split("/");
        issueDate = `${y}-${m}-${d}`;
      }

      return {
        ...validatedData,
        issue_date: issueDate,
        raw_ai_response: rawText,
      };
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      errors.push(`[${provider.name}]: ${errMessage}`);
    }
  }

  throw new Error(`Todos os provedores de IA falharam:\n${errors.join("\n")}`);
}
