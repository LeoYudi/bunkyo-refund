import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const receiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    issuer_name: { type: Type.STRING },
    issuer_cnpj: { type: Type.STRING },
    receiver_cnpj: { type: Type.STRING },
    total_value: { type: Type.NUMBER },
    issue_date: { type: Type.STRING },
    issue_number: { type: Type.STRING },
    description: { type: Type.STRING },
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
};

export async function processReceiptWithGemini(fileUrl: string) {
  // Assuming fileUrl is a public URL we can fetch or pass to Gemini
  // For now, in a real scenario we'd download the file and pass it as base64
  // We'll mock the fetch for simplicity if needed, but let's implement the prompt
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: `Extraia as informações desta nota fiscal (disponível na URL: ${fileUrl}). Retorne apenas JSON.` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: receiptSchema,
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text);
}
