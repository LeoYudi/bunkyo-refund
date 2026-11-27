import { GoogleGenAI } from "@google/genai";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import { createClient } from "@/lib/supabase/server";
import { processReceiptWithAI } from "./ai.service";

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(),
}));

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

describe("ai.service.ts - processReceiptWithAI (Multi-Provider Fallback)", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  let mockStorage: { from: Mock; download: Mock };
  let mockSupabase: { storage: { from: Mock; download: Mock } };
  let mockInteractions: { create: Mock };
  let mockGoogleGenAI: { interactions: { create: Mock } };
  let fetchMock: Mock;

  const sampleReceiptPayload = {
    issuer_name: "Supermarket",
    issuer_cnpj: "12.345.678/0001-90",
    receiver_cnpj: "09.876.543/0001-12",
    total_value: 150.5,
    issue_date: "2026-03-16",
    issue_number: "12345",
    description: "Groceries",
  };

  function mockDownloadedFile(content = "dummy-receipt-data") {
    const mockFileBuffer = new TextEncoder().encode(content).buffer;
    mockStorage.download.mockResolvedValue({
      data: { arrayBuffer: vi.fn().mockResolvedValue(mockFileBuffer) },
      error: null,
    });
    return mockFileBuffer;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.MISTRAL_API_KEY;
    delete process.env.MISTRAL_MODEL;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.AI_PROVIDER_ORDER;

    mockStorage = {
      from: vi.fn().mockReturnThis(),
      download: vi.fn(),
    };

    mockSupabase = {
      storage: mockStorage,
    };

    vi.mocked(createClient).mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>,
    );

    mockInteractions = {
      create: vi.fn(),
    };

    mockGoogleGenAI = {
      interactions: mockInteractions,
    };

    // biome-ignore lint/complexity/useArrowFunction: we need a constructor function to mock a class
    vi.mocked(GoogleGenAI).mockImplementation(function () {
      return mockGoogleGenAI as unknown as GoogleGenAI;
    });

    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  describe("Supabase Storage download errors", () => {
    it("should throw 'Falha ao baixar o arquivo do Supabase' if download fails (e.g. RLS) without calling any AI provider", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      process.env.GEMINI_API_KEY = "sk-gemini";

      mockStorage.download.mockResolvedValue({
        data: null,
        error: new Error("RLS Error"),
      });

      await expect(
        processReceiptWithAI("receipts/123.jpg", "image/jpeg"),
      ).rejects.toThrow("Falha ao baixar o arquivo do Supabase");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(GoogleGenAI).not.toHaveBeenCalled();
    });

    it("should throw 'Falha ao baixar o arquivo do Supabase' if downloaded fileData is null even without error without calling any AI provider", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      mockStorage.download.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        processReceiptWithAI("receipts/123.jpg", "image/jpeg"),
      ).rejects.toThrow("Falha ao baixar o arquivo do Supabase");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(GoogleGenAI).not.toHaveBeenCalled();
    });
  });

  describe("Contract preservation and normalization", () => {
    it("returns the 7 ReceiptAIExtractionSchema fields + raw_ai_response and normalizes issue_date from DD/MM/YYYY to YYYY-MM-DD", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      mockDownloadedFile("dummy-image-data");

      const rawResponse = JSON.stringify({
        ...sampleReceiptPayload,
        issue_date: "16/03/2026",
      });

      fetchMock.mockResolvedValueOnce(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: rawResponse } }],
          },
        }),
      );

      const result = await processReceiptWithAI(
        "receipts/123.jpg",
        "image/jpeg",
      );

      expect(result).toEqual({
        ...sampleReceiptPayload,
        issue_date: "2026-03-16",
        raw_ai_response: rawResponse,
      });
      expect(Object.keys(result).sort()).toEqual([
        "description",
        "issue_date",
        "issue_number",
        "issuer_cnpj",
        "issuer_name",
        "raw_ai_response",
        "receiver_cnpj",
        "total_value",
      ]);
    });

    it("processes PDF receipts via Mistral OCR + Chat Completions when Mistral is configured", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      process.env.GEMINI_API_KEY = "sk-gemini";
      mockDownloadedFile("dummy-pdf-data");

      const rawResponse = JSON.stringify(sampleReceiptPayload);

      fetchMock.mockImplementation(async (url: string) => {
        if (url === "https://api.mistral.ai/v1/ocr") {
          return createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              pages: [
                { index: 0, markdown: "Nota Fiscal Supermarket R$ 150,50" },
              ],
            },
          });
        }
        if (url === "https://api.mistral.ai/v1/chat/completions") {
          return createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              choices: [{ message: { content: rawResponse } }],
            },
          });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      });

      const result = await processReceiptWithAI(
        "receipts/123.pdf",
        "application/pdf",
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.mistral.ai/v1/ocr",
      );
      expect(fetchMock.mock.calls[1]?.[0]).toBe(
        "https://api.mistral.ai/v1/chat/completions",
      );
      expect(GoogleGenAI).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...sampleReceiptPayload,
        raw_ai_response: rawResponse,
      });
    });
  });

  describe("Default priority order (mistral -> openrouter -> gemini)", () => {
    it("uses Mistral and does NOT call OpenRouter or Gemini when MISTRAL_API_KEY is configured and succeeds", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      process.env.GEMINI_API_KEY = "sk-gemini";
      mockDownloadedFile("dummy-image-data");

      const rawResponse = JSON.stringify(sampleReceiptPayload);

      fetchMock.mockResolvedValueOnce(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: rawResponse } }],
          },
        }),
      );

      const result = await processReceiptWithAI(
        "receipts/123.jpg",
        "image/jpeg",
      );

      expect(createClient).toHaveBeenCalled();
      expect(mockStorage.from).toHaveBeenCalledWith("receipts");
      expect(mockStorage.download).toHaveBeenCalledWith("receipts/123.jpg");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.mistral.ai/v1/chat/completions",
      );
      expect(GoogleGenAI).not.toHaveBeenCalled();

      expect(result).toEqual({
        ...sampleReceiptPayload,
        raw_ai_response: rawResponse,
      });
    });

    it("falls back automatically to OpenRouter when Mistral fails with 429 Rate Limit", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      process.env.GEMINI_API_KEY = "sk-gemini";
      mockDownloadedFile("dummy-image-data");

      const openRouterJson = JSON.stringify({
        ...sampleReceiptPayload,
        issuer_name: "Loja OpenRouter",
        issue_date: "20/03/2026",
      });
      const callOrder: string[] = [];

      fetchMock.mockImplementation(async (url: string) => {
        if (url === "https://api.mistral.ai/v1/chat/completions") {
          callOrder.push("mistral");
          return createFetchResponse({
            ok: false,
            status: 429,
            textData: "Rate limit exceeded",
          });
        }
        if (url === "https://openrouter.ai/api/v1/chat/completions") {
          callOrder.push("openrouter");
          return createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              choices: [
                {
                  message: { content: `\`\`\`json\n${openRouterJson}\n\`\`\`` },
                },
              ],
            },
          });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      });

      const result = await processReceiptWithAI(
        "receipts/123.jpg",
        "image/jpeg",
      );

      expect(callOrder).toEqual(["mistral", "openrouter"]);
      expect(GoogleGenAI).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...sampleReceiptPayload,
        issuer_name: "Loja OpenRouter",
        issue_date: "2026-03-20",
        raw_ai_response: openRouterJson,
      });
    });

    it("falls back automatically to Gemini when both Mistral and OpenRouter fail", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      process.env.GEMINI_API_KEY = "sk-gemini";
      mockDownloadedFile("dummy-image-data");

      const callOrder: string[] = [];

      fetchMock.mockImplementation(async (url: string) => {
        if (url === "https://api.mistral.ai/v1/chat/completions") {
          callOrder.push("mistral");
          return createFetchResponse({
            ok: false,
            status: 429,
            textData: "Rate limit exceeded",
          });
        }
        if (url === "https://openrouter.ai/api/v1/chat/completions") {
          callOrder.push("openrouter");
          return createFetchResponse({
            ok: false,
            status: 500,
            textData: "Upstream error",
          });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      });

      const geminiJson = JSON.stringify({
        ...sampleReceiptPayload,
        issuer_name: "Loja Gemini",
      });
      mockInteractions.create.mockImplementation(async () => {
        callOrder.push("gemini");
        return { output_text: geminiJson };
      });

      const result = await processReceiptWithAI(
        "receipts/123.jpg",
        "image/jpeg",
      );

      expect(callOrder).toEqual(["mistral", "openrouter", "gemini"]);
      expect(result).toEqual({
        ...sampleReceiptPayload,
        issuer_name: "Loja Gemini",
        raw_ai_response: geminiJson,
      });
    });

    it("skips unconfigured Mistral and OpenRouter and uses Gemini directly when only GEMINI_API_KEY is configured", async () => {
      process.env.GEMINI_API_KEY = "sk-gemini";
      mockDownloadedFile("dummy-pdf-data");

      const geminiJson = JSON.stringify(sampleReceiptPayload);
      mockInteractions.create.mockResolvedValue({
        output_text: geminiJson,
      });

      const result = await processReceiptWithAI(
        "receipts/123.pdf",
        "application/pdf",
      );

      expect(fetchMock).not.toHaveBeenCalled();
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiVersion: "v1beta" });
      expect(result).toEqual({
        ...sampleReceiptPayload,
        raw_ai_response: geminiJson,
      });
    });

    it("skips unconfigured Mistral and uses OpenRouter when only OPENROUTER_API_KEY and GEMINI_API_KEY are configured", async () => {
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      process.env.GEMINI_API_KEY = "sk-gemini";
      mockDownloadedFile("dummy-image-data");

      const openRouterJson = JSON.stringify(sampleReceiptPayload);
      fetchMock.mockResolvedValueOnce(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: openRouterJson } }],
          },
        }),
      );

      const result = await processReceiptWithAI(
        "receipts/123.jpg",
        "image/jpeg",
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://openrouter.ai/api/v1/chat/completions",
      );
      expect(GoogleGenAI).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...sampleReceiptPayload,
        raw_ai_response: openRouterJson,
      });
    });
  });

  describe("Custom provider priority order (AI_PROVIDER_ORDER)", () => {
    it("respects AI_PROVIDER_ORDER='openrouter,mistral,gemini' and calls OpenRouter first", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      process.env.GEMINI_API_KEY = "sk-gemini";
      process.env.AI_PROVIDER_ORDER = "openrouter,mistral,gemini";
      mockDownloadedFile("dummy-image-data");

      const openRouterJson = JSON.stringify({
        ...sampleReceiptPayload,
        issuer_name: "Primeiro OpenRouter",
      });

      fetchMock.mockResolvedValueOnce(
        createFetchResponse({
          ok: true,
          status: 200,
          jsonData: {
            choices: [{ message: { content: openRouterJson } }],
          },
        }),
      );

      const result = await processReceiptWithAI(
        "receipts/123.jpg",
        "image/jpeg",
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://openrouter.ai/api/v1/chat/completions",
      );
      expect(GoogleGenAI).not.toHaveBeenCalled();
      expect(result.issuer_name).toBe("Primeiro OpenRouter");
    });

    it("falls back according to custom AI_PROVIDER_ORDER='openrouter,mistral,gemini' (OpenRouter fails -> Mistral)", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      process.env.GEMINI_API_KEY = "sk-gemini";
      process.env.AI_PROVIDER_ORDER = "openrouter,mistral,gemini";
      mockDownloadedFile("dummy-image-data");

      const callOrder: string[] = [];
      const mistralJson = JSON.stringify({
        ...sampleReceiptPayload,
        issuer_name: "Segundo Mistral",
      });

      fetchMock.mockImplementation(async (url: string) => {
        if (url === "https://openrouter.ai/api/v1/chat/completions") {
          callOrder.push("openrouter");
          return createFetchResponse({
            ok: false,
            status: 503,
            textData: "Service Unavailable",
          });
        }
        if (url === "https://api.mistral.ai/v1/chat/completions") {
          callOrder.push("mistral");
          return createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              choices: [{ message: { content: mistralJson } }],
            },
          });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      });

      const result = await processReceiptWithAI(
        "receipts/123.jpg",
        "image/jpeg",
      );

      expect(callOrder).toEqual(["openrouter", "mistral"]);
      expect(GoogleGenAI).not.toHaveBeenCalled();
      expect(result.issuer_name).toBe("Segundo Mistral");
    });
  });

  describe("Fallback on invalid JSON or Zod validation failure", () => {
    it("falls back to the next configured provider when a provider returns malformed JSON", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      mockDownloadedFile("dummy-image-data");

      const validJson = JSON.stringify(sampleReceiptPayload);
      const callOrder: string[] = [];

      fetchMock.mockImplementation(async (url: string) => {
        if (url === "https://api.mistral.ai/v1/chat/completions") {
          callOrder.push("mistral");
          return createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              choices: [{ message: { content: "NOT JSON" } }],
            },
          });
        }
        if (url === "https://openrouter.ai/api/v1/chat/completions") {
          callOrder.push("openrouter");
          return createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              choices: [{ message: { content: validJson } }],
            },
          });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      });

      const result = await processReceiptWithAI(
        "receipts/123.jpg",
        "image/jpeg",
      );

      expect(callOrder).toEqual(["mistral", "openrouter"]);
      expect(result).toEqual({
        ...sampleReceiptPayload,
        raw_ai_response: validJson,
      });
    });

    it("falls back to the next configured provider when a provider returns JSON that fails ReceiptAIExtractionSchema validation", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      mockDownloadedFile("dummy-image-data");

      const invalidSchemaJson = JSON.stringify({
        // missing required nullable keys & wrong type for total_value
        total_value: "150.5",
      });
      const validJson = JSON.stringify(sampleReceiptPayload);
      const callOrder: string[] = [];

      fetchMock.mockImplementation(async (url: string) => {
        if (url === "https://api.mistral.ai/v1/chat/completions") {
          callOrder.push("mistral");
          return createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              choices: [{ message: { content: invalidSchemaJson } }],
            },
          });
        }
        if (url === "https://openrouter.ai/api/v1/chat/completions") {
          callOrder.push("openrouter");
          return createFetchResponse({
            ok: true,
            status: 200,
            jsonData: {
              choices: [{ message: { content: validJson } }],
            },
          });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      });

      const result = await processReceiptWithAI(
        "receipts/123.jpg",
        "image/jpeg",
      );

      expect(callOrder).toEqual(["mistral", "openrouter"]);
      expect(result).toEqual({
        ...sampleReceiptPayload,
        raw_ai_response: validJson,
      });
    });
  });

  describe("Exhaustion and unconfigured provider errors", () => {
    it("throws a descriptive error without calling any provider when no AI provider has an API key configured", async () => {
      mockDownloadedFile("dummy-image-data");

      await expect(
        processReceiptWithAI("receipts/123.jpg", "image/jpeg"),
      ).rejects.toThrow(/configurado|provider|provedor|api key|chave/i);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(GoogleGenAI).not.toHaveBeenCalled();
    });

    it("throws a consolidated error listing all provider failure reasons when all configured providers fail", async () => {
      process.env.MISTRAL_API_KEY = "sk-mistral";
      process.env.OPENROUTER_API_KEY = "sk-openrouter";
      process.env.GEMINI_API_KEY = "sk-gemini";
      mockDownloadedFile("dummy-image-data");

      fetchMock.mockImplementation(async (url: string) => {
        if (url === "https://api.mistral.ai/v1/chat/completions") {
          return createFetchResponse({
            ok: false,
            status: 429,
            textData: "Rate limit exceeded",
          });
        }
        if (url === "https://openrouter.ai/api/v1/chat/completions") {
          return createFetchResponse({
            ok: false,
            status: 500,
            textData: "Internal server error",
          });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      });

      mockInteractions.create.mockResolvedValue({
        output_text: null,
      });

      let caughtError: unknown;
      try {
        await processReceiptWithAI("receipts/123.jpg", "image/jpeg");
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(Error);
      const message = (caughtError as Error).message;
      expect(message).toMatch(/mistral/i);
      expect(message).toMatch(/429|rate limit/i);
      expect(message).toMatch(/openrouter/i);
      expect(message).toMatch(/500|internal/i);
      expect(message).toMatch(/gemini/i);
      expect(message).toMatch(/não retornou nenhum texto/i);
    });
  });
});
