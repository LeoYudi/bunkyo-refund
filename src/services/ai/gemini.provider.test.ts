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
import { GeminiProvider } from "./gemini.provider";

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(),
}));

describe("GeminiProvider", () => {
  const originalEnv = process.env;
  let mockInteractionsCreate: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_MODELS;

    mockInteractionsCreate = vi.fn();

    // biome-ignore lint/complexity/useArrowFunction: constructor function required to mock class
    vi.mocked(GoogleGenAI).mockImplementation(function () {
      return {
        interactions: {
          create: mockInteractionsCreate,
        },
      } as unknown as GoogleGenAI;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exposes 'gemini' as provider name", () => {
    const provider = new GeminiProvider();
    expect(provider.name).toBe("gemini");
  });

  describe("isConfigured", () => {
    it("returns true when GEMINI_API_KEY is defined", () => {
      process.env.GEMINI_API_KEY = "gemini-key-123";
      const provider = new GeminiProvider();
      expect(provider.isConfigured()).toBe(true);
    });

    it("returns true when GOOGLE_API_KEY is defined", () => {
      process.env.GOOGLE_API_KEY = "google-key-123";
      const provider = new GeminiProvider();
      expect(provider.isConfigured()).toBe(true);
    });

    it("returns false when both GEMINI_API_KEY and GOOGLE_API_KEY are absent", () => {
      const provider = new GeminiProvider();
      expect(provider.isConfigured()).toBe(false);
    });

    it("returns false when keys are empty or whitespace", () => {
      const provider = new GeminiProvider();
      process.env.GEMINI_API_KEY = "   ";
      process.env.GOOGLE_API_KEY = "";
      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe("extract", () => {
    const samplePrompt =
      "Extraia os dados da nota fiscal em anexo. Se um dado não existir, retorne null.";

    const expectedResponseFormat = {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "object",
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

    it("instantiates GoogleGenAI with v1beta and calls interactions.create with type 'image' for image receipts", async () => {
      process.env.GEMINI_API_KEY = "gemini-key-123";
      const expectedJson = JSON.stringify({
        issuer_name: "Supermercado",
        issuer_cnpj: "12.345.678/0001-90",
        receiver_cnpj: "09.876.543/0001-12",
        total_value: 99.9,
        issue_date: "2026-03-10",
        issue_number: "001",
        description: "Mantimentos",
      });

      mockInteractionsCreate.mockResolvedValue({
        output_text: expectedJson,
      });

      const provider = new GeminiProvider();
      const base64Data = Buffer.from("image-bytes").toString("base64");

      const result = await provider.extract({
        base64Data,
        mimeType: "image/jpeg",
        prompt: samplePrompt,
      });

      expect(GoogleGenAI).toHaveBeenCalledWith({ apiVersion: "v1beta" });
      expect(mockInteractionsCreate).toHaveBeenCalledTimes(1);
      expect(mockInteractionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-3.8-flash",
          input: [
            {
              type: "text",
              text: samplePrompt,
            },
            {
              type: "image",
              data: base64Data,
              mime_type: "image/jpeg",
            },
          ],
          response_format: expectedResponseFormat,
        }),
      );

      expect(result).toEqual({
        provider: "gemini",
        rawText: expectedJson,
      });
    });

    it("calls interactions.create with type 'document' for application/pdf", async () => {
      process.env.GOOGLE_API_KEY = "google-key-456";
      const expectedJson = JSON.stringify({
        issuer_name: "Livraria",
        issuer_cnpj: "11.222.333/0001-44",
        receiver_cnpj: null,
        total_value: 45,
        issue_date: "2026-03-11",
        issue_number: "NF-12",
        description: "Livros",
      });

      mockInteractionsCreate.mockResolvedValue({
        output_text: expectedJson,
      });

      const provider = new GeminiProvider();
      const base64Data = Buffer.from("pdf-bytes").toString("base64");

      const result = await provider.extract({
        base64Data,
        mimeType: "application/pdf",
        prompt: samplePrompt,
      });

      expect(GoogleGenAI).toHaveBeenCalledWith({ apiVersion: "v1beta" });
      expect(mockInteractionsCreate).toHaveBeenCalledTimes(1);
      expect(mockInteractionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: [
            {
              type: "text",
              text: samplePrompt,
            },
            {
              type: "document",
              data: base64Data,
              mime_type: "application/pdf",
            },
          ],
        }),
      );

      expect(result).toEqual({
        provider: "gemini",
        rawText: expectedJson,
      });
    });

    it("throws 'A IA não retornou nenhum texto.' if interaction.output_text is null or empty", async () => {
      process.env.GEMINI_API_KEY = "gemini-key-123";

      const provider = new GeminiProvider();

      mockInteractionsCreate.mockResolvedValue({
        output_text: null,
      });
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow("A IA não retornou nenhum texto.");

      mockInteractionsCreate.mockResolvedValue({
        output_text: "",
      });
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow("A IA não retornou nenhum texto.");
    });

    it("throws a descriptive error when no Gemini API key is configured", async () => {
      const provider = new GeminiProvider();

      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow(/gemini|google|api key|configurad/i);

      expect(GoogleGenAI).not.toHaveBeenCalled();
    });

    describe("model rotation and fallback", () => {
      const defaultModels = [
        "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
      ];

      function getCalledModels(): string[] {
        return mockInteractionsCreate.mock.calls.map(
          (call) => (call[0] as { model: string }).model,
        );
      }

      function makeExpectedJson(issuerName = "Supermercado"): string {
        return JSON.stringify({
          issuer_name: issuerName,
          issuer_cnpj: "12.345.678/0001-90",
          receiver_cnpj: "09.876.543/0001-12",
          total_value: 99.9,
          issue_date: "2026-03-10",
          issue_number: "001",
          description: "Mantimentos",
        });
      }

      it("falls back automatically from gemini-3.8-flash to gemini-3.6-flash when the first model fails with 429 Rate limit exceeded and stops once valid output_text is returned", async () => {
        process.env.GEMINI_API_KEY = "gemini-key-123";
        const expectedJson = makeExpectedJson("Mercado Fallback");

        mockInteractionsCreate
          .mockRejectedValueOnce(new Error("429 Rate limit exceeded"))
          .mockResolvedValueOnce({ output_text: expectedJson });

        const provider = new GeminiProvider();
        const base64Data = Buffer.from("image-bytes").toString("base64");

        const result = await provider.extract({
          base64Data,
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        });

        expect(mockInteractionsCreate).toHaveBeenCalledTimes(2);
        expect(getCalledModels()).toEqual([
          "gemini-3.8-flash",
          "gemini-3.6-flash",
        ]);
        expect(mockInteractionsCreate).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            model: "gemini-3.6-flash",
            input: [
              { type: "text", text: samplePrompt },
              {
                type: "image",
                data: base64Data,
                mime_type: "image/jpeg",
              },
            ],
            response_format: expectedResponseFormat,
          }),
        );
        expect(result).toEqual({
          provider: "gemini",
          rawText: expectedJson,
        });
      });

      it("rotates through default models ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'] on 503 and blank output_text until the fourth model succeeds", async () => {
        process.env.GEMINI_API_KEY = "gemini-key-123";
        const expectedJson = makeExpectedJson("Papelaria Quarto Modelo");

        mockInteractionsCreate
          .mockRejectedValueOnce(new Error("503 Service Unavailable"))
          .mockResolvedValueOnce({ output_text: "   " })
          .mockRejectedValueOnce(new Error("503 Model overloaded"))
          .mockResolvedValueOnce({ output_text: expectedJson });

        const provider = new GeminiProvider();
        const base64Data = Buffer.from("pdf-bytes").toString("base64");

        const result = await provider.extract({
          base64Data,
          mimeType: "application/pdf",
          prompt: samplePrompt,
        });

        expect(mockInteractionsCreate).toHaveBeenCalledTimes(4);
        expect(getCalledModels()).toEqual(defaultModels);
        expect(mockInteractionsCreate).toHaveBeenNthCalledWith(
          4,
          expect.objectContaining({
            model: "gemini-3.1-flash-lite",
            input: [
              { type: "text", text: samplePrompt },
              {
                type: "document",
                data: base64Data,
                mime_type: "application/pdf",
              },
            ],
            response_format: expectedResponseFormat,
          }),
        );
        expect(result).toEqual({
          provider: "gemini",
          rawText: expectedJson,
        });
      });

      it("respects custom GEMINI_MODELS list (e.g. 'gemini-3.5-flash-lite,gemini-3.8-flash') and falls back within that list", async () => {
        process.env.GEMINI_API_KEY = "gemini-key-123";
        process.env.GEMINI_MODELS = "gemini-3.5-flash-lite,gemini-3.8-flash";
        const expectedJson = makeExpectedJson("Custom List Success");

        mockInteractionsCreate
          .mockRejectedValueOnce(new Error("429 Rate limit exceeded"))
          .mockResolvedValueOnce({ output_text: expectedJson });

        const provider = new GeminiProvider();
        const result = await provider.extract({
          base64Data: "abc",
          mimeType: "image/png",
          prompt: samplePrompt,
        });

        expect(mockInteractionsCreate).toHaveBeenCalledTimes(2);
        expect(getCalledModels()).toEqual([
          "gemini-3.5-flash-lite",
          "gemini-3.8-flash",
        ]);
        expect(result).toEqual({
          provider: "gemini",
          rawText: expectedJson,
        });
      });

      it("trims whitespace/empty entries in GEMINI_MODELS and does not fall back to default models when custom list fails", async () => {
        process.env.GEMINI_API_KEY = "gemini-key-123";
        process.env.GEMINI_MODELS =
          " gemini-3.5-flash-lite , , gemini-3.1-flash-lite ";

        mockInteractionsCreate
          .mockRejectedValueOnce(new Error("429 Quota exceeded"))
          .mockRejectedValueOnce(new Error("503 Backend error"));

        const provider = new GeminiProvider();
        let caughtError: unknown;
        try {
          await provider.extract({
            base64Data: "abc",
            mimeType: "image/jpeg",
            prompt: samplePrompt,
          });
        } catch (err) {
          caughtError = err;
        }

        expect(mockInteractionsCreate).toHaveBeenCalledTimes(2);
        expect(getCalledModels()).toEqual([
          "gemini-3.5-flash-lite",
          "gemini-3.1-flash-lite",
        ]);
        expect(caughtError).toBeInstanceOf(Error);
        const message = (caughtError as Error).message;
        expect(message).toContain("gemini-3.5-flash-lite");
        expect(message).toContain("429 Quota exceeded");
        expect(message).toContain("gemini-3.1-flash-lite");
        expect(message).toContain("503 Backend error");
        expect(message).not.toContain("gemini-3.8-flash");
        expect(message).not.toContain("gemini-3.6-flash");
      });

      it("falls back to default model list when GEMINI_MODELS is empty or whitespace", async () => {
        process.env.GEMINI_API_KEY = "gemini-key-123";
        process.env.GEMINI_MODELS = "  ,   ";
        const expectedJson = makeExpectedJson("Default After Blank Env");

        mockInteractionsCreate
          .mockRejectedValueOnce(new Error("429 Rate limit exceeded"))
          .mockResolvedValueOnce({ output_text: expectedJson });

        const provider = new GeminiProvider();
        const result = await provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        });

        expect(mockInteractionsCreate).toHaveBeenCalledTimes(2);
        expect(getCalledModels()).toEqual([
          "gemini-3.8-flash",
          "gemini-3.6-flash",
        ]);
        expect(result).toEqual({
          provider: "gemini",
          rawText: expectedJson,
        });
      });

      it("throws a consolidated error containing all model names and failure reasons in order when all default models fail", async () => {
        process.env.GEMINI_API_KEY = "gemini-key-123";

        mockInteractionsCreate
          .mockRejectedValueOnce(new Error("429 Rate limit exceeded"))
          .mockRejectedValueOnce(new Error("503 Service Unavailable"))
          .mockResolvedValueOnce({ output_text: null })
          .mockRejectedValueOnce(new Error("500 Internal Server Error"));

        const provider = new GeminiProvider();
        let caughtError: unknown;
        try {
          await provider.extract({
            base64Data: "abc",
            mimeType: "image/jpeg",
            prompt: samplePrompt,
          });
        } catch (err) {
          caughtError = err;
        }

        expect(mockInteractionsCreate).toHaveBeenCalledTimes(4);
        expect(getCalledModels()).toEqual(defaultModels);
        expect(caughtError).toBeInstanceOf(Error);

        const message = (caughtError as Error).message;
        expect(message).toContain("gemini-3.8-flash");
        expect(message).toContain("429 Rate limit exceeded");
        expect(message).toContain("gemini-3.6-flash");
        expect(message).toContain("503 Service Unavailable");
        expect(message).toContain("gemini-3.5-flash-lite");
        expect(message).toMatch(/não retornou nenhum texto/i);
        expect(message).toContain("gemini-3.1-flash-lite");
        expect(message).toContain("500 Internal Server Error");

        expect(message.indexOf("gemini-3.8-flash")).toBeLessThan(
          message.indexOf("gemini-3.6-flash"),
        );
        expect(message.indexOf("gemini-3.6-flash")).toBeLessThan(
          message.indexOf("gemini-3.5-flash-lite"),
        );
        expect(message.indexOf("gemini-3.5-flash-lite")).toBeLessThan(
          message.indexOf("gemini-3.1-flash-lite"),
        );
      });
    });
  });
});
