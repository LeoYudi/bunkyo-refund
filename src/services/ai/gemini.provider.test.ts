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

      mockInteractionsCreate.mockResolvedValueOnce({
        output_text: null,
      });
      await expect(
        provider.extract({
          base64Data: "abc",
          mimeType: "image/jpeg",
          prompt: samplePrompt,
        }),
      ).rejects.toThrow("A IA não retornou nenhum texto.");

      mockInteractionsCreate.mockResolvedValueOnce({
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
  });
});
