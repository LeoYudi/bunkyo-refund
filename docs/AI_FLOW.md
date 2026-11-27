# Integração com IA Multi-Provider (Mistral AI → OpenRouter → Gemini)

## Objetivo

Implementar a extração automatizada de dados de notas fiscais (imagens e PDFs) utilizando múltiplos provedores de inteligência artificial com suporte a fallback automático: **Mistral AI**, **OpenRouter** e **Google Gemini**.

## Dependências Necessárias

- Nenhuma nova dependência foi instalada; utilizamos `fetch` nativo para Mistral AI e OpenRouter, e o SDK `@google/genai` (versão `>=2.3.0`) para o Gemini.
- Variáveis de ambiente configuradas: `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`), `AI_PROVIDER_ORDER`.

## Provedores Implementados (`src/services/ai/`)

1. **`mistral.provider.ts`**:
   - Suporta imagens via Chat Completions (`mistral-small-latest`) com formato JSON object.
   - Suporta PDFs chamando primeiramente Mistral OCR (`mistral-ocr-latest`) e extraindo o markdown concatenado das páginas antes da chamada de chat.
2. **`openrouter.provider.ts`**:
   - Suporta imagens (`image_url`) e PDFs (`file`) via Chat Completions (`mistralai/mistral-small-3.1-24b-instruct:free`).
   - Limpa automaticamente blocos de código markdown (` ```json ... ``` `).
3. **`gemini.provider.ts`**:
   - Inicializa `GoogleGenAI` com `apiVersion: "v1beta"` e chama `interactions.create` com `gemini-3.8-flash` e Structured Output Zod/JSON schema.

## Orquestrador com Fallback (`src/services/ai.service.ts`)

- Baixa o arquivo do Supabase Storage (`receipts`) **uma única vez**.
- Monta a lista de provedores ativos baseada em `AI_PROVIDER_ORDER` (default `"mistral,openrouter,gemini"`) e `isConfigured()`.
- Percorre cada provedor tentando a extração, parse de JSON e validação Zod (`ReceiptAIExtractionSchema`). Em caso de falha, acumula o motivo e continua para o próximo provedor.
- Retorna o objeto validado acrescido de `raw_ai_response`.
