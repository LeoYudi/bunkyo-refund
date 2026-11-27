export type AIProviderName = "mistral" | "openrouter" | "gemini";

export interface AIExtractionInput {
  base64Data: string;
  mimeType: string;
  prompt: string;
}

export interface AIExtractionRawResult {
  provider: AIProviderName;
  rawText: string;
}

export interface AIProvider {
  name: AIProviderName;
  isConfigured(): boolean;
  extract(input: AIExtractionInput): Promise<AIExtractionRawResult>;
}
