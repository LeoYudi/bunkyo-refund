# Fluxo de Submissão de Reembolso (`/submit`)

## 1. Visão Geral
A rota `/submit` é a página pública onde o solicitante (sem necessidade de login) envia seu pedido de reembolso. Ela deve ser simples, "mobile-first", e ter o objetivo de coletar o nome de quem receberá o reembolso e o arquivo do comprovante (PDF ou Imagem). 

Conforme definido no PRD, os arquivos devem ter no máximo 5MB e possuir extensão `.pdf`, `.png`, `.jpg` ou `.jpeg`.

---

## 2. Estrutura da Página e Layout

A página principal (`src/app/(public)/submit/page.tsx`) conterá um formulário construído com `react-hook-form` e integrado ao `zod` para validação no lado do cliente.

O layout deve ser dividido nas seguintes etapas/estados de interface:

1. **Cabeçalho:** Título claro (ex: "Solicitar Reembolso") e breves instruções para o solicitante.
2. **Estado Inicial (Seleção de Arquivo e Nome):**
   - Um campo de texto (`<Input>`) para o preenchimento do `requester_name`.
   - O componente `ReceiptUploader` (que já inclui internamente o `CameraCapture`), servindo como área de "drag and drop" ou clique para seleção/captura do comprovante.
3. **Estado de Pré-visualização (Confirmação):**
   - Assim que um arquivo for selecionado através do `ReceiptUploader`, o formulário deve ocultar a área de upload e passar a exibir o componente `ReceiptPreview`, fornecendo a ele o arquivo (`File`) selecionado.
   - O usuário pode visualizar os dados do arquivo, e caso seja o arquivo errado, clicar no botão "Cancelar" presente no `ReceiptPreview` (o que limpa o arquivo selecionado e volta ao Estado Inicial).
4. **Estado de Submissão (Loading & Success):**
   - Ao clicar no botão "Confirmar" do `ReceiptPreview`, que deve engatilhar a submissão do formulário, o sistema exibe um estado de carregamento global no form (desabilitando botões para prevenir múltiplos envios).
   - Após o sucesso do envio, a página deve exibir um "Sucesso" (através de um card de feedback ou redirecionamento para uma página `/submit/success`), instruindo o usuário de que o pedido foi enviado para triagem.

---

## 3. Gerenciamento de Estado e Validação (Zod + React Hook Form)

No banco de dados e nos serviços, utilizamos o `CreateRefundSchema` da camada de domínio (que espera um `receipt_file_url` tipo string). Porém, no frontend, nós lidamos inicialmente com um objeto `File` que precisará ser upado.

Por isso, precisamos de um **Schema exclusivo para o Formulário do Frontend**, garantindo a validação da extensão e do peso do arquivo.

**Exemplo de Frontend Schema:**
```typescript
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

export const SubmitRefundFormSchema = z.object({
  requester_name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  file: z.instanceof(File, { message: "O comprovante é obrigatório." })
    .refine((file) => file.size <= MAX_FILE_SIZE, "O arquivo deve ter no máximo 5MB.")
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Formato inválido. Envie PDF, PNG ou JPG."
    ),
});
```

---

## 4. Fluxo de Dados (Data Flow)

O percurso de um pedido da interface até o banco de dados ocorre em 5 passos:

1. **Interação do Usuário (Client-side):**
   - O usuário preenche o seu nome no `<Input>` e solta/seleciona um arquivo via `ReceiptUploader`.
   - O `react-hook-form` recebe esse arquivo e valida via schema do Zod (tamanho e formato).
2. **Ação de Confirmação (Client-side):**
   - O usuário confere os dados no `ReceiptPreview` e clica em "Confirmar".
   - A função `onSubmit` do formulário é acionada. Como a API "Server Actions" pode lidar melhor com arquivos utilizando `FormData`, a função `onSubmit` no frontend cria um `FormData` e anexa o `requester_name` e o `file` (Blob/File).
3. **Chamada ao Backend (Server Action):**
   - O frontend chama a Server Action `createRefundAction(formData)` (localizada em `src/actions/refund.action.ts`).
4. **Upload para Storage (Supabase):**
   - **Camada de Services/Actions:** O arquivo é retirado do `FormData`.
   - É feito o upload desse binário para o bucket de Storage `receipts` via cliente do Supabase. O Supabase então retorna o caminho onde salvou, e com isso o backend monta uma URL pública (`receipt_file_url`).
5. **Persistência no Banco de Dados:**
   - Com o `requester_name` (do FormData) e a nova `receipt_file_url`, a action formata os dados e valida contra o schema do domínio real (`CreateRefundSchema` de `src/models/refund.model.ts`).
   - A action chama o caso de uso (`refund.service.ts`) ou repositório (`refund.repository.ts`), inserindo a solicitação de reembolso no PostgreSQL com o status inicial setado em `PENDING`.
   - A requisição se encerra retornando `{ success: true }`.

---

## 5. Exemplo Rápido de Integração (Draft para o Desenvolvedor)

```tsx
// src/app/(public)/submit/page.tsx (Client Component)
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// importar SubmitRefundFormSchema, ReceiptUploader, ReceiptPreview e a Action

export default function SubmitPage() {
  const form = useForm({
    resolver: zodResolver(SubmitRefundFormSchema),
    defaultValues: { requester_name: "" }
  });
  
  const file = form.watch("file");

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("requester_name", data.requester_name);
      formData.append("file", data.file);
      
      // Chamada Server Action (Atenção: Tratar states de loading)
      const res = await createRefundAction(formData);
      
      if(res.success) {
        // Redireciona para /submit/success ou exibe Toast
      }
    } catch (error) {
       // Tratar mensagens de erro do servidor
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <header>
         <h1 className="text-2xl font-bold">Solicitar Reembolso</h1>
      </header>

      <form className="space-y-6">
         {/* Input Nome */}
         <div>
            <label>Nome Completo</label>
            <Input {...form.register("requester_name")} placeholder="João Silva" />
            {/* Erro de validação do hook-form */}
         </div>
         
         {/* Área Condicional do Arquivo */}
         {!file ? (
           <ReceiptUploader 
             onFileSelect={(f) => form.setValue("file", f, { shouldValidate: true })} 
           />
         ) : (
           <ReceiptPreview 
              file={file} 
              onCancel={() => form.setValue("file", null)}
              // O componente ReceiptPreview deve disparar a Action de submit
              onConfirm={form.handleSubmit(onSubmit)} 
           />
         )}
      </form>
    </div>
  )
}
```

## Resumo para o Desenvolvedor que implementar:
- **Priorize mobile-first:** O usuário irá acessar essa página na rua após ter pago uma despesa e tirar uma foto pelo celular.
- **Não esqueça o FormData:** É mais seguro e padrão para trafegar arquivos binários com Next.js Server Actions.
- **Separe o Schema:** Faça o `SubmitRefundFormSchema` para frontend, já que o Zod original que valida no BD (`CreateRefundSchema`) requer a `string` de URL do arquivo já feito o upload, e não o `File` cru.
