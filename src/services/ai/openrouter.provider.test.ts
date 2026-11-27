import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenRouterProvider } from "./openrouter.provider";

interface OpenRouterContentPart {
  type: string;
  text?: string;
  image_url?: { url: string };
  file?: { filename: string; file_data: string };
}

interface OpenRouterPlugin {
  id: string;
  pdf?: {
    engine: string;
  };
}

interface OpenRouterRequestBody {
  model: string;
  response_format?: { type: string };
  plugins?: OpenRouterPlugin[];
  messages: Array<{
    role: string;
    content: string | OpenRouterContentPart[];
  }>;
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

describe("OpenRouterProvider", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_MODEL;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("exposes 'openrouter' as provider name", () => {
    const provider = new OpenRouterProvider();
    expect(provider.name).toBe("openrouter");
  });

  describe("isConfigured", () => {
    it("returns true when OPENROUTER_API_KEY is defined", () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key";
      const provider = new OpenRouterProvider();
      expect(provider.isConfigured()).toBe(true);
    });

    it("returns false when OPENROUTER_API_KEY is undefined", () => {
      const provider = new OpenRouterProvider();
      expect(provider.isConfigured()).toBe(false);
    });

    it("returns false when OPENROUTER_API_KEY is empty or whitespace", () => {
      const provider = new OpenRouterProvider();
      process.env.OPENROUTER_API_KEY = "";
      expect(provider.isConfigured()).toBe(false);

      process.env.OPENROUTER_API_KEY = "   ";
      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe("extract", () => {
    const samplePrompt =
      "Extraia os dados da nota fiscal em anexo em JSON válido.";

    const samplePayloadObj = {
      issuer_name: "Restaurante Bunkyo",
      issuer_cnpj: "12.345.678/0001-90",
      receiver_cnpj: "09.876.543/0001-12",
      total_value: 210.75,
      issue_date: "2026-03-20",
      issue_number: "NF-456",
      description: "Almoço corporativo",
    };

    const samplePayloadJson = JSON.stringify(samplePayloadObj);

    it("extracts data from image/jpeg using default OpenRouter model ('openrouter/free') and image_url object format", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-image";
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

      const provider = new OpenRouterProvider();
      const base64Data = Buffer.from("jpeg-data").toString("base64");

      const result = await provider.extract({
        base64Data,
        mimeType: "image/jpeg",
        prompt: samplePrompt,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer sk-or-v1-image",
          "Content-Type": "application/json",
        }),
      );

      const body = JSON.parse(init.body as string) as OpenRouterRequestBody;
      expect(body.model).toBe("openrouter/free");
      expect(body.response_format).toEqual({ type: "json_object" });
      expect(body).not.toHaveProperty("plugins");

      const contentParts = body.messages.flatMap((m) =>
        Array.isArray(m.content) ? m.content : [],
      );
      expect(contentParts).toContainEqual({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${base64Data}` },
      });
      expect(JSON.stringify(body.messages)).toContain(samplePrompt);

      expect(result).toEqual({
        provider: "openrouter",
        rawText: samplePayloadJson,
      });
    });

    it("respects custom OPENROUTER_MODEL when configured", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-custom";
      process.env.OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free";

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

      const provider = new OpenRouterProvider();
      await provider.extract({
        base64Data: "abc",
        mimeType: "image/png",
        prompt: samplePrompt,
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as OpenRouterRequestBody;
      expect(body.model).toBe("google/gemini-2.0-flash-exp:free");
      expect(body).not.toHaveProperty("plugins");
    });

    it("falls back to 'openrouter/free' when OPENROUTER_MODEL is empty or whitespace", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-whitespace";
      process.env.OPENROUTER_MODEL = "   ";

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

      const provider = new OpenRouterProvider();
      await provider.extract({
        base64Data: "abc",
        mimeType: "image/png",
        prompt: samplePrompt,
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as OpenRouterRequestBody;
      expect(body.model).toBe("openrouter/free");
    });

    it("sends file block with receipt.pdf and free cloudflare-ai file-parser plugin for application/pdf using default model 'openrouter/free'", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-pdf";
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

      const provider = new OpenRouterProvider();
      const base64Data = Buffer.from("pdf-data").toString("base64");

      const result = await provider.extract({
        base64Data,
        mimeType: "application/pdf",
        prompt: samplePrompt,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");

      const body = JSON.parse(init.body as string) as OpenRouterRequestBody;
      expect(body.model).toBe("openrouter/free");
      expect(body.plugins).toEqual([
        {
          id: "file-parser",
          pdf: {
            engine: "cloudflare-ai",
          },
        },
      ]);

      const contentParts = body.messages.flatMap((m) =>
        Array.isArray(m.content) ? m.content : [],
      );
      expect(contentParts).toContainEqual({
        type: "file",
        file: {
          filename: "receipt.pdf",
          file_data: `data:application/pdf;base64,${base64Data}`,
        },
      });
      expect(JSON.stringify(body.messages)).toContain(samplePrompt);

      expect(result).toEqual({
        provider: "openrouter",
        rawText: samplePayloadJson,
      });
    });

    it("includes cloudflare-ai file-parser plugin for application/pdf even when custom OPENROUTER_MODEL is configured", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-pdf-custom";
      process.env.OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free";
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

      const provider = new OpenRouterProvider();
      await provider.extract({
        base64Data: Buffer.from("pdf-data").toString("base64"),
        mimeType: "application/pdf",
        prompt: samplePrompt,
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as OpenRouterRequestBody;
      expect(body.model).toBe("google/gemini-2.0-flash-exp:free");
      expect(body.plugins).toEqual([
        {
          id: "file-parser",
          pdf: {
            engine: "cloudflare-ai",
          },
        },
      ]);
    });

    it("does not send plugins payload property when mimeType is an image (image/*)", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-img-no-plugins";
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

      const provider = new OpenRouterProvider();
      for (const mimeType of ["image/jpeg", "image/png", "image/webp"]) {
        await provider.extract({
          base64Data: "abc",
          mimeType,
          prompt: samplePrompt,
        });
      }

      expect(fetchMock).toHaveBeenCalledTimes(3);
      for (const [, init] of fetchMock.mock.calls as Array<
        [string, RequestInit]
      >) {
        const body = JSON.parse(init.body as string) as OpenRouterRequestBody;
        expect("plugins" in body).toBe(false);
        expect(body.plugins).toBeUndefined();
      }
    });

    it("strips ```json markdown code fences so rawText is valid parseable JSON", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-markdown";
      const wrappedContent = `\`\`\`json\n${samplePayloadJson}\n\`\`\``;

      global.fetch = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: wrappedContent } }],
          },
        }),
      );

      const provider = new OpenRouterProvider();
      const result = await provider.extract({
        base64Data: "abc",
        mimeType: "image/jpeg",
        prompt: samplePrompt,
      });

      expect(result.provider).toBe("openrouter");
      expect(result.rawText).not.toContain("```");
      expect(JSON.parse(result.rawText)).toEqual(samplePayloadObj);
    });

    it("strips generic ``` markdown code fences without language tag", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-markdown-generic";
      const wrappedContent = `  \`\`\`\n${samplePayloadJson}\n\`\`\`  `;

      global.fetch = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: wrappedContent } }],
          },
        }),
      );

      const provider = new OpenRouterProvider();
      const result = await provider.extract({
        base64Data: "abc",
        mimeType: "image/jpeg",
        prompt: samplePrompt,
      });

      expect(result.rawText).not.toContain("```");
      expect(JSON.parse(result.rawText)).toEqual(samplePayloadObj);
    });

    it("throws a descriptive error if OPENROUTER_API_KEY is missing", async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      const provider = new OpenRouterProvider();
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/openrouter|api key|configurad/i);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("throws a descriptive error when OpenRouter returns 429 rate limit", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-test";
      global.fetch = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: false,
          status: 429,
          textData: "Too Many Requests",
          jsonData: { error: { message: "Too Many Requests" } },
        }),
      );

      const provider = new OpenRouterProvider();
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/429|too many|openrouter/i);
    });

    it("throws a descriptive error when OpenRouter returns 500", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-test";
      global.fetch = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: false,
          status: 500,
          textData: "Upstream provider failure",
        }),
      );

      const provider = new OpenRouterProvider();
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/500|openrouter/i);
    });

    it("throws a descriptive error when OpenRouter returns empty content", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-test";
      global.fetch = vi.fn().mockResolvedValue(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: "   " } }],
          },
        }),
      );

      const provider = new OpenRouterProvider();
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/vazi|empty|retornou|openrouter/i);
    });

    it("throws a descriptive error for unsupported mimeType", async () => {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-test";
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      const provider = new OpenRouterProvider();
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
