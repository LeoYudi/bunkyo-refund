import { describe, expect, it, vi } from "vitest";
import { processReceiptAction } from "./ai.actions";

// Mocking the AI service
vi.mock("../services/ai.service", () => ({
  processReceiptWithGemini: vi.fn().mockResolvedValue({
    issuer_name: "Test Company",
    issuer_cnpj: "12345678000199",
    receiver_cnpj: "98765432000199",
    total_value: 100.5,
    issue_date: "2024-01-01",
    issue_number: "1234",
    description: "Test description",
  }),
}));

describe("processReceiptAction", () => {
  it("should return structured output from Gemini", async () => {
    const result = await processReceiptAction(
      "https://example.com/receipt.pdf",
    );
    expect(result.success).toBe(true);
    expect(result.data?.issuer_name).toBe("Test Company");
  });
});
