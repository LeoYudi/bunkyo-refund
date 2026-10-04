# Integração com Gemini AI para Leitura de Notas (Fase 3)

## Objetivo
Implementar a extração automatizada de dados de notas fiscais (imagens e PDFs) utilizando a Inteligência Artificial do Google (modelo `gemini-3.8-flash`). A implementação utilizará a nova Interactions API via SDK `@google/genai`.

## Dependências Necessárias
- A SDK oficial atualizada será necessária: `@google/genai` (versão `>=2.3.0`). 
- **⚠️ ALERTA DE REGRA:** O subagente Dev/Principal **DEVE** parar e pedir permissão ao usuário antes de rodar `pnpm add @google/genai`. Nunca instale sem perguntar.
- Variável de ambiente `GEMINI_API_KEY` configurada.

## Plano de Orquestração de Agentes (TDD)

1. **Notion Sync (Agente Principal):** Mover o card da Fase 3 para "In progress" usando o `notion-mcp-server`.
2. **Branching (Agente Principal):** Criar a branch `feat/ai-receipt-extraction`.
3. **QA Agent (Testes Primeiro):** 
   - Criar `src/services/ai.service.test.ts`.
   - Implementar testes unitários (Vitest) mockando o cliente `GoogleGenAI` e o `supabase.storage` para garantir que o serviço chama a API com os parâmetros corretos e lida com falhas de RLS/download.
4. **Dev Agent (Implementação):**
   - Ler os testes criados pelo QA.
   - Implementar `src/services/ai.service.ts` para fazer os testes passarem.
   - Conectar o serviço à Server Action apropriada em `src/actions/`.

## Plano de Implementação (Arquitetura DDD)

### 1. Modelos (src/models/refund.model.ts)
Criar ou atualizar o Zod Schema para representar os dados esperados do Gemini.
```typescript
import { z } from 'zod';

export const ReceiptAIExtractionSchema = z.object({
  issuer_name: z.string().nullable(),
  issuer_cnpj: z.string().nullable(),
  receiver_cnpj: z.string().nullable(),
  total_value: z.number().nullable(), // Ajustar formatação via prompt se necessário
  issue_date: z.string().nullable(),
  issue_number: z.string().nullable(),
  description: z.string().nullable()
});
```

### 2. Regra de Negócio (src/services/ai.service.ts)
Este serviço será responsável por baixar o arquivo do Supabase (lidando com RLS) e enviar para o Gemini.

```typescript
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server'; // Assumindo a existência de um client server-side
import { ReceiptAIExtractionSchema } from '@/models/refund.model';

export async function processReceiptWithAI(storagePath: string, mimeType: string) {
  // 1. Download do arquivo de forma segura via Supabase (respeitando RLS)
  const supabase = await createClient();
  const { data: fileData, error } = await supabase.storage
    .from('receipts')
    .download(storagePath);
    
  if (error || !fileData) throw new Error('Falha ao baixar o arquivo do Supabase');
  
  const arrayBuffer = await fileData.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');
  
  const fileInputType = mimeType.startsWith('image/') ? 'image' : 'document';

  // 2. Inicialização do Cliente Gemini
  const ai = new GoogleGenAI({}); // Usa process.env.GEMINI_API_KEY automaticamente
  
  // 3. Chamada à Interactions API com Structured Output
  const interaction = await ai.interactions.create({
    model: 'gemini-3.8-flash',
    input: [
      {
        type: 'text',
        text: 'Extraia os dados da nota fiscal em anexo. Se um dado não existir, retorne null. Converta valores monetários para número real (padrão americano).'
      },
      {
        type: fileInputType,
        data: base64Data,
        mime_type: mimeType
      }
    ],
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: {
        type: 'object',
        properties: {
          issuer_name: { type: 'string' },
          issuer_cnpj: { type: 'string' },
          receiver_cnpj: { type: 'string' },
          total_value: { type: 'number' },
          issue_date: { type: 'string' },
          issue_number: { type: 'string' },
          description: { type: 'string' }
        },
        // Todas as propriedades são obrigatórias na estrutura, podendo ter o valor 'null'
        required: ['issuer_name', 'issuer_cnpj', 'receiver_cnpj', 'total_value', 'issue_date', 'issue_number', 'description']
      }
    }
  });

  if (!interaction.output_text) throw new Error('A IA não retornou nenhum texto.');

  // 4. Parse e Validação Zod garantindo os tipos
  const rawData = JSON.parse(interaction.output_text);
  const validatedData = ReceiptAIExtractionSchema.parse(rawData);
  
  return validatedData;
}
```

### 3. Integração na Action (src/actions/refund.action.ts)
A Server Action ativada pelo botão "Aprovar para Leitura" apenas orquestrará as chamadas:
1. Chama o `ai.service.ts` passando o caminho do Supabase Storage.
2. Com o JSON retornado, atualiza a UI ou usa o `refund.repository.ts` para persistir o resultado no PostgreSQL, alterando o status da nota.
