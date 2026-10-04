import { GoogleGenAI } from "@google/genai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { processReceiptWithAI } from "./ai.service";

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(),
}));

describe("ai.service.ts - processReceiptWithAI", () => {
  let mockSupabase: any;
  let mockStorage: any;
  let mockGoogleGenAI: any;
  let mockInteractions: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorage = {
      from: vi.fn().mockReturnThis(),
      download: vi.fn(),
    };

    mockSupabase = {
      storage: mockStorage,
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    mockInteractions = {
      create: vi.fn(),
    };

    mockGoogleGenAI = {
      interactions: mockInteractions,
    };

    // biome-ignore lint/complexity/useArrowFunction: we need a constructor function to mock a class
    (GoogleGenAI as any).mockImplementation(function () {
      return mockGoogleGenAI;
    });
  });

  const expectedPrompt =
    "Extraia os dados da nota fiscal em anexo. Se um dado não existir, retorne null. Converta valores monetários para número real (padrão americano).";

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

  it("should process image receipt successfully (happy path)", async () => {
    const mockFileBuffer = new TextEncoder().encode("dummy-image-data").buffer;
    mockStorage.download.mockResolvedValue({
      data: { arrayBuffer: vi.fn().mockResolvedValue(mockFileBuffer) },
      error: null,
    });

    const mockAiResponse = {
      issuer_name: "Supermarket",
      issuer_cnpj: "12.345.678/0001-90",
      receiver_cnpj: "09.876.543/0001-12",
      total_value: 150.5,
      issue_date: "2023-10-01",
      issue_number: "12345",
      description: "Groceries",
    };

    mockInteractions.create.mockResolvedValue({
      output_text: JSON.stringify(mockAiResponse),
    });

    const result = await processReceiptWithAI("receipts/123.jpg", "image/jpeg");

    expect(createClient).toHaveBeenCalled();
    expect(mockStorage.from).toHaveBeenCalledWith("receipts");
    expect(mockStorage.download).toHaveBeenCalledWith("receipts/123.jpg");

    expect(GoogleGenAI).toHaveBeenCalledWith({});

    const expectedBase64 = Buffer.from(mockFileBuffer).toString("base64");

    expect(mockInteractions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.8-flash",
        input: [
          {
            type: "text",
            text: expectedPrompt,
          },
          {
            type: "image",
            data: expectedBase64,
            mime_type: "image/jpeg",
          },
        ],
        response_format: expectedResponseFormat,
      }),
    );

    expect(result).toEqual(mockAiResponse);
  });

  it("should throw an error if Supabase download fails (e.g. RLS)", async () => {
    mockStorage.download.mockResolvedValue({
      data: null,
      error: new Error("RLS Error"),
    });

    await expect(
      processReceiptWithAI("receipts/123.jpg", "image/jpeg"),
    ).rejects.toThrow("Falha ao baixar o arquivo do Supabase");

    expect(GoogleGenAI).not.toHaveBeenCalled();
  });

  it("should throw an error if downloaded fileData is null even without error", async () => {
    mockStorage.download.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      processReceiptWithAI("receipts/123.jpg", "image/jpeg"),
    ).rejects.toThrow("Falha ao baixar o arquivo do Supabase");

    expect(GoogleGenAI).not.toHaveBeenCalled();
  });

  it("should throw an error if Gemini returns no text", async () => {
    const mockFileBuffer = new TextEncoder().encode("dummy-image-data").buffer;
    mockStorage.download.mockResolvedValue({
      data: { arrayBuffer: vi.fn().mockResolvedValue(mockFileBuffer) },
      error: null,
    });

    mockInteractions.create.mockResolvedValue({
      output_text: null, // Gemini returned no text
    });

    await expect(
      processReceiptWithAI("receipts/123.jpg", "image/jpeg"),
    ).rejects.toThrow("A IA não retornou nenhum texto.");
  });

  it("should format document type correctly if mime type is PDF", async () => {
    const mockFileBuffer = new TextEncoder().encode("dummy-pdf-data").buffer;
    mockStorage.download.mockResolvedValue({
      data: { arrayBuffer: vi.fn().mockResolvedValue(mockFileBuffer) },
      error: null,
    });

    const mockAiResponse = {
      issuer_name: null,
      issuer_cnpj: null,
      receiver_cnpj: null,
      total_value: null,
      issue_date: null,
      issue_number: null,
      description: null,
    };

    mockInteractions.create.mockResolvedValue({
      output_text: JSON.stringify(mockAiResponse),
    });

    await processReceiptWithAI("receipts/123.pdf", "application/pdf");

    const expectedBase64 = Buffer.from(mockFileBuffer).toString("base64");

    expect(mockInteractions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: [
          {
            type: "text",
            text: expectedPrompt,
          },
          {
            type: "document",
            data: expectedBase64,
            mime_type: "application/pdf",
          },
        ],
      }),
    );
  });

  it("should throw a validation error if the AI returns invalid JSON structure", async () => {
    const mockFileBuffer = new TextEncoder().encode("dummy-image-data").buffer;
    mockStorage.download.mockResolvedValue({
      data: { arrayBuffer: vi.fn().mockResolvedValue(mockFileBuffer) },
      error: null,
    });

    const invalidAiResponse = {
      // missing fields
      total_value: "150.5", // string instead of number
    };

    mockInteractions.create.mockResolvedValue({
      output_text: JSON.stringify(invalidAiResponse),
    });

    // We can't import ZodError directly without importing Zod, so let's check it doesn't throw 'Not implemented'
    // but throws something else, or just check the constructor name if possible.
    // Actually we can import ZodError from 'zod'.
    const { ZodError } = await import("zod");
    await expect(
      processReceiptWithAI("receipts/123.jpg", "image/jpeg"),
    ).rejects.toThrow(ZodError);
  });

  it("should throw an error if the AI returns malformed JSON", async () => {
    const mockFileBuffer = new TextEncoder().encode("dummy-image-data").buffer;
    mockStorage.download.mockResolvedValue({
      data: { arrayBuffer: vi.fn().mockResolvedValue(mockFileBuffer) },
      error: null,
    });

    mockInteractions.create.mockResolvedValue({
      output_text: "NOT JSON",
    });

    await expect(
      processReceiptWithAI("receipts/123.jpg", "image/jpeg"),
    ).rejects.toThrow(SyntaxError);
  });
});
