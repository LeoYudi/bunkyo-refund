import type {
  AIExtractionInput,
  AIExtractionRawResult,
  AIProvider,
  AIProviderName,
} from "./types";

export class MistralAIProvider implements AIProvider {
  readonly name: AIProviderName = "mistral";

  isConfigured(): boolean {
    throw new Error("Not implemented");
  }

  async extract(_input: AIExtractionInput): Promise<AIExtractionRawResult> {
    throw new Error("Not implemented");
  }
}
