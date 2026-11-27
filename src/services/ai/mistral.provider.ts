import type {
  AIExtractionInput,
  AIExtractionRawResult,
  AIProvider,
} from "./types";

export class MistralAIProvider implements AIProvider {
  readonly name = "mistral";

  isConfigured(): boolean {
    return Boolean(process.env.MISTRAL_API_KEY?.trim());
  }

  async extract(input: AIExtractionInput): Promise<AIExtractionRawResult> {
    const apiKey = process.env.MISTRAL_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("Mistral API key is not configured (MISTRAL_API_KEY).");
    }

    const { base64Data, mimeType, prompt } = input;
    if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
      throw new Error(`Unsupported MIME type for Mistral: ${mimeType}`);
    }

    const model = process.env.MISTRAL_MODEL?.trim() || "mistral-small-latest";
    let ocrMarkdown = "";

    if (mimeType === "application/pdf") {
      const ocrResponse = await fetch("https://api.mistral.ai/v1/ocr", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            document_url: `data:application/pdf;base64,${base64Data}`,
          },
        }),
      });

      if (!ocrResponse.ok) {
        const errText = await ocrResponse.text();
        throw new Error(
          `Mistral OCR API error (${ocrResponse.status}): ${errText}`,
        );
      }

      const ocrData = (await ocrResponse.json()) as {
        pages?: Array<{ markdown?: string }>;
      };

      const pages = ocrData.pages || [];
      ocrMarkdown = pages
        .map((p) => p.markdown)
        .filter(Boolean)
        .join("\n\n");

      if (!ocrMarkdown.trim()) {
        throw new Error("Mistral OCR returned empty pages or text.");
      }
    }

    let messagesContent: unknown;
    if (mimeType.startsWith("image/")) {
      messagesContent = [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: `data:${mimeType};base64,${base64Data}`,
        },
      ];
    } else {
      messagesContent = `${prompt}\n\nConteúdo OCR do documento:\n${ocrMarkdown}`;
    }

    const chatResponse = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: messagesContent }],
        }),
      },
    );

    if (!chatResponse.ok) {
      const errText = await chatResponse.text();
      throw new Error(`Mistral API error (${chatResponse.status}): ${errText}`);
    }

    const chatData = (await chatResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawText = chatData.choices?.[0]?.message?.content;
    if (!rawText?.trim()) {
      throw new Error("Mistral API returned empty content.");
    }

    return {
      provider: "mistral",
      rawText,
    };
  }
}
