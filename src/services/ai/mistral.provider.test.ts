import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MistralAIProvider } from "./mistral.provider";

interface MistralChatContentPart {
  type: string;
  text?: string;
  image_url?: string;
}

interface MistralChatRequestBody {
  model: string;
  response_format?: { type: string };
  messages: Array<{
    role: string;
    content: string | MistralChatContentPart[];
  }>;
}

interface MistralOcrRequestBody {
  model: string;
  document: {
    type: string;
    document_url: string;
  };
}

function createFetchResponse(options: {
  ok: boolean;
  status: number;
  jsonData?: unknown;
  textData?: string;
}): Response {
  return {
    ok: options.ok,
    status: options.status,
    statusText: options.ok ? "OK" : "Error",
    json: vi.fn().mockResolvedValue(options.jsonData ?? {}),
    text: vi
      .fn()
      .mockResolvedValue(
        options.textData ?? JSON.stringify(options.jsonData ?? {}),
      ),
  } as unknown as Response;
}

describe("MistralAIProvider", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.MISTRAL_API_KEY;
    delete process.env.MISTRAL_MODEL;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("exposes 'mistral' as provider name", () => {
    const provider = new MistralAIProvider();
    expect(provider.name).toBe("mistral");
  });

  describe("isConfigured", () => {
    it("returns true when MISTRAL_API_KEY is defined", () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-test-key";
      const provider = new MistralAIProvider();
      expect(provider.isConfigured()).toBe(true);
    });

    it("returns false when MISTRAL_API_KEY is undefined", () => {
      const provider = new MistralAIProvider();
      expect(provider.isConfigured()).toBe(false);
    });

    it("returns false when MISTRAL_API_KEY is empty or whitespace", () => {
      const provider = new MistralAIProvider();
      process.env.MISTRAL_API_KEY = "";
      expect(provider.isConfigured()).toBe(false);

      process.env.MISTRAL_API_KEY = "   ";
      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe("extract", () => {
    const samplePrompt =
      "Extraia os dados da nota fiscal em anexo em JSON válido.";

    const samplePayloadJson = JSON.stringify({
      issuer_name: "Papelaria Bunkyo",
      issuer_cnpj: "12.345.678/0001-90",
      receiver_cnpj: "09.876.543/0001-12",
      total_value: 150.5,
      issue_date: "2026-03-16",
      issue_number: "NF-987",
      description: "Materiais de escritório",
    });

    it("extracts data from image/jpeg via Mistral chat completions with default model", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-image-key";
      const fetchMock = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: samplePayloadJson } }],
          },
        }),
      );
      global.fetch = fetchMock;

      const provider = new MistralAIProvider();
      const base64Data = Buffer.from("jpeg-bytes").toString("base64");

      const result = await provider.extract({
        base64Data,
        mimeType: "image/jpeg",
        prompt: samplePrompt,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.mistral.ai/v1/chat/completions");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer sk-mistral-image-key",
          "Content-Type": "application/json",
        }),
      );

      const body = JSON.parse(init.body as string) as MistralChatRequestBody;
      expect(body.model).toBe("mistral-small-latest");
      expect(body.response_format).toEqual({ type: "json_object" });

      const contentParts = body.messages.flatMap((m) =>
        Array.isArray(m.content) ? m.content : [],
      );
      expect(contentParts).toContainEqual({
        type: "image_url",
        image_url: `data:image/jpeg;base64,${base64Data}`,
      });
      expect(JSON.stringify(body.messages)).toContain(samplePrompt);

      expect(result).toEqual({
        provider: "mistral",
        rawText: samplePayloadJson,
      });
    });

    it("supports image/png and respects custom MISTRAL_MODEL", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-custom";
      process.env.MISTRAL_MODEL = "pixtral-12b-2409";

      const fetchMock = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: samplePayloadJson } }],
          },
        }),
      );
      global.fetch = fetchMock;

      const provider = new MistralAIProvider();
      const base64Data = Buffer.from("png-bytes").toString("base64");

      await provider.extract({
        base64Data,
        mimeType: "image/png",
        prompt: samplePrompt,
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as MistralChatRequestBody;
      expect(body.model).toBe("pixtral-12b-2409");

      const contentParts = body.messages.flatMap((m) =>
        Array.isArray(m.content) ? m.content : [],
      );
      expect(contentParts).toContainEqual({
        type: "image_url",
        image_url: `data:image/png;base64,${base64Data}`,
      });
    });

    it("extracts data from application/pdf by calling Mistral OCR first and then chat completions with page markdown", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-pdf-key";
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              pages: [
                {
                  index: 0,
                  markdown: "# Nota Fiscal 987\nEmitente: Papelaria Bunkyo",
                },
                {
                  index: 1,
                  markdown: "Valor Total: R$ 150,50",
                },
              ],
            },
          }),
        )
        .mockResolvedValueOnce(
          createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              choices: [{ message: { content: samplePayloadJson } }],
            },
          }),
        );
      global.fetch = fetchMock;

      const provider = new MistralAIProvider();
      const base64Data = Buffer.from("pdf-bytes").toString("base64");

      const result = await provider.extract({
        base64Data,
        mimeType: "application/pdf",
        prompt: samplePrompt,
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Step 1: Mistral OCR call
      const [ocrUrl, ocrInit] = fetchMock.mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect(ocrUrl).toBe("https://api.mistral.ai/v1/ocr");
      expect(ocrInit.method).toBe("POST");
      expect(ocrInit.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer sk-mistral-pdf-key",
          "Content-Type": "application/json",
        }),
      );
      const ocrBody = JSON.parse(
        ocrInit.body as string,
      ) as MistralOcrRequestBody;
      expect(ocrBody).toEqual({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          document_url: `data:application/pdf;base64,${base64Data}`,
        },
      });

      // Step 2: Chat Completions call using extracted markdown
      const [chatUrl, chatInit] = fetchMock.mock.calls[1] as [
        string,
        RequestInit,
      ];
      expect(chatUrl).toBe("https://api.mistral.ai/v1/chat/completions");
      expect(chatInit.method).toBe("POST");
      expect(chatInit.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer sk-mistral-pdf-key",
          "Content-Type": "application/json",
        }),
      );
      const chatBody = JSON.parse(
        chatInit.body as string,
      ) as MistralChatRequestBody;
      expect(chatBody.model).toBe("mistral-small-latest");
      expect(chatBody.response_format).toEqual({ type: "json_object" });

      const serializedMessages = JSON.stringify(chatBody.messages);
      expect(serializedMessages).toContain(samplePrompt);
      expect(serializedMessages).toContain("Emitente: Papelaria Bunkyo");
      expect(serializedMessages).toContain("Valor Total: R$ 150,50");

      expect(result).toEqual({
        provider: "mistral",
        rawText: samplePayloadJson,
      });
    });

    it("throws a descriptive error if MISTRAL_API_KEY is missing", async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      const provider = new MistralAIProvider();
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/mistral|api key|configurad/i);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("throws a descriptive error when chat/completions returns 429 rate limit", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-test";
      global.fetch = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: false,
          status: 429,
          textData: "Rate limit exceeded",
          jsonData: { message: "Rate limit exceeded" },
        }),
      );

      const provider = new MistralAIProvider();
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/429|rate limit|mistral/i);
    });

    it("throws a descriptive error when chat/completions returns 500", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-test";
      global.fetch = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: false,
          status: 500,
          textData: "Internal Server Error",
          jsonData: { error: "Internal Server Error" },
        }),
      );

      const provider = new MistralAIProvider();
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/500|mistral/i);
    });

    it("throws a descriptive error and does not call chat/completions when Mistral OCR returns HTTP error", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-test";
      const fetchMock = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: false,
          status: 500,
          textData: "OCR service unavailable",
        }),
      );
      global.fetch = fetchMock;

      const provider = new MistralAIProvider();
      await expect(
        provider.extract({
          base64Data: "pdf-data",
          mimeType: "application/pdf",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/500|ocr|mistral/i);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws a descriptive error when Mistral OCR returns empty pages", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-test";
      const fetchMock = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: { pages: [] },
        }),
      );
      global.fetch = fetchMock;

      const provider = new MistralAIProvider();
      await expect(
        provider.extract({
          base64Data: "pdf-data",
          mimeType: "application/pdf",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/ocr|vazio|empty|texto|mistral/i);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws a descriptive error when chat/completions returns empty content", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-test";
      global.fetch = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: "" } }],
          },
        }),
      );

      const provider = new MistralAIProvider();
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/vazi|empty|retornou|mistral/i);
    });

    it("throws a descriptive error for unsupported mimeType", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral-test";
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      const provider = new MistralAIProvider();
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "application/octet-stream",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/mime|suportad|unsupported/i);

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
