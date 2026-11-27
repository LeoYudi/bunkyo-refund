import type {
  AIExtractionInput,
  AIExtractionRawResult,
  AIProvider,
} from "./types";

export class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter";

  isConfigured(): boolean {
    return Boolean(process.env.OPENROUTER_API_KEY?.trim());
  }

  async extract(input: AIExtractionInput): Promise<AIExtractionRawResult> {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "OpenRouter API key is not configured (OPENROUTER_API_KEY).",
      );
    }

    const { base64Data, mimeType, prompt } = input;
    if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
      throw new Error(`Unsupported MIME type for OpenRouter: ${mimeType}`);
    }

    const model = process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";

    let contentBlock: unknown;
    if (mimeType.startsWith("image/")) {
      contentBlock = {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      };
    } else {
      contentBlock = {
        type: "file",
        file: {
          filename: "receipt.pdf",
          file_data: `data:application/pdf;base64,${base64Data}`,
        },
      };
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                contentBlock,
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    let rawText = data.choices?.[0]?.message?.content;
    if (!rawText?.trim()) {
      throw new Error("OpenRouter returned empty content.");
    }

    // Strip markdown code fences if any
    rawText = rawText
      .replace(/^```[a-zA-Z]*\s*/gm, "")
      .replace(/```\s*$/gm, "")
      .trim();

    return {
      provider: "openrouter",
      rawText,
    };
  }
}
