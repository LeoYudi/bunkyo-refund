# Documento de Arquitetura (Architecture)

## Visão Geral do Sistema
O sistema é um Dashboard Web projetado para automatizar o fluxo de pedidos de reembolso de notas fiscais. O sistema permite o upload de notas fiscais (PDFs ou Imagens), utiliza a API do Gemini para ler e extrair os dados da nota automaticamente (OCR e estruturação de dados), armazena essas informações, e por fim, emite um e-mail com os dados de reembolso para o departamento financeiro.

## Estrutura Multi-Agentes (Metodologia de Desenvolvimento)
O sistema será desenvolvido majoritariamente de forma autônoma utilizando um time de subagentes IA, orquestrados pelo Agente principal (Tech Lead). 
1. **Tech Lead**: Planejamento e coordenação.
2. **Frontend Engineer**: Componentes, UI (Tailwind + Shadcn) e integrações na tela.
3. **Backend Engineer**: Supabase (Auth, Storage, DB) e API Routes do Next.js.
4. **AI Engineer**: Prompts de extração de dados e chamadas à API do Gemini.
5. **QA & Security**: Testes automatizados (Vitest), testes de edge-cases, falhas de IA e segurança da informação.

---

## Stack Tecnológica (A "Stack Zero Custo")
As escolhas tecnológicas foram orientadas pelo princípio do menor custo possível (aproveitando os melhores "Free Tiers" do mercado), sem sacrificar a escalabilidade e a facilidade de desenvolvimento para a IA.

### 1. Frontend & Backend: Next.js + TypeScript + Vercel
*   **Framework e Linguagem:** **Next.js (React)** estritamente tipado com **TypeScript**. Será utilizado tanto para a interface do usuário (Dashboard) quanto para as rotas de backend (API Routes / Server Actions). *(Nota técnica: O Next.js moderno não utiliza o Vite para rodar/compilar o projeto, ele utiliza o seu próprio motor chamado Turbopack, que é construído em Rust e possui uma velocidade equivalente ou superior ao Vite. O projeto será criado com a CLI do Next.js utilizando Turbopack).*
*   **Hospedagem:** Vercel (Hobby Tier). Proporciona CI/CD automático, hospedagem global do frontend e execução serverless gratuita do backend.
*   **Estilização:** Tailwind CSS + Shadcn/UI (Facilita a geração de interfaces consistentes e modernas por agentes de IA).

### 2. Banco de Dados, Storage e Autenticação: Supabase
Plataforma "Backend as a Service" (BaaS) baseada em PostgreSQL.
*   **Database:** PostgreSQL. Armazenará os usuários e os metadados das notas fiscais extraídas (CNPJ, valor, data, status de aprovação, etc).
*   **Storage (Bucket):** Armazenará os arquivos brutos (PDFs e Imagens) das notas fiscais após o upload.
*   **Auth:** Gerenciará as sessões e permissões de usuários.

### 3. Motor de Inteligência Artificial: Google Gemini
Responsável pela lógica central de OCR (Optical Character Recognition) e extração inteligente.
*   **Modelo Primário:** Gemini 1.5 Flash (Gratuito, super rápido, suporta upload direto de arquivos visuais).
*   **Integração:** O backend Next.js fará o proxy do arquivo para a API do Gemini, utilizando a funcionalidade "Structured Output" (forçando o retorno a ser um JSON perfeitamente formatado para o banco de dados).

### 4. Serviço de Disparo de E-mails: Resend
*   **Ferramenta:** Resend + React Email.
*   **Papel:** Receber os dados estruturados da nota, gerar um template HTML visualmente agradável (utilizando React Email) e enviá-lo por SMTP/API para o e-mail cadastrado do departamento financeiro.

### 5. Qualidade de Código e Testes (QA)
*   **Ferramenta de Testes (Unitários):** **Vitest**. Moderno, incrivelmente rápido, possui a mesma API do Jest e será a arma principal do Subagente de QA.
*   **Escopo de Testes:** O Vitest cobrirá tanto o Frontend (componentes da UI e formulários) quanto o Backend (lógica das chamadas de API, formatação e integrações).
*   **Estratégia de Colocalização:** Os arquivos de teste (`.test.ts` ou `.test.tsx`) ficarão na mesma pasta do arquivo de código correspondente (ex: `ai.service.ts` e `ai.service.test.ts` lado a lado).
*   **Linter e Formatter:** **Biome** (`biomejs`).
*   **Por que Biome:** Escrito em Rust, ele substitui a necessidade de termos o ESLint e o Prettier rodando juntos. Ele faz o trabalho dos dois em uma fração de segundo, mantendo todo o código gerado pelos agentes rigorosamente formatado e livre de anti-patterns de TypeScript.

---

## Estrutura de Pastas e Responsabilidades (Backend Refinado - Padrão DDD)

Para mantermos o código extremamente limpo, escalável e testável (TDD), nós separaremos as responsabilidades de backend utilizando o padrão MVC/DDD adaptado para o ecossistema Serverless do Next.js. 

```text
bunkyo-refund-project/
├── src/
│   ├── app/                    # [Views / Rotas UI]
│   │   ├── (public)/submit/    # Interface pública
│   │   └── (auth)/admin/       # Interface protegida
│   │
│   ├── components/             # [Frontend UI]
│   │   └── features/UploadForm.tsx
│   │
│   ├── models/                 # 1. [Camada de Domínio / Dados]
│   │   ├── refund.model.ts     # Schemas de validação (Zod) e Tipos TS base
│   │   └── refund.model.test.ts
│   │
│   ├── repositories/           # 2. [Camada de Acesso a Dados]
│   │   ├── refund.repository.ts# Abstração do Supabase (Insert, Select, Update)
│   │   └── refund.repository.test.ts
│   │
│   ├── services/               # 3. [Camada de Regra de Negócio]
│   │   ├── refund.service.ts   # Orquestra as regras (Valida nota, chama IA, salva via repo)
│   │   ├── ai.service.ts       # Lógica do Gemini isolada
│   │   └── email.service.ts    # Lógica de disparo
│   │
│   └── actions/                # 4. [Camada de Controllers / Entrypoints]
│       ├── refund.action.ts    # Server Actions (Recebem payload do frontend, chamam Services)
│       └── refund.action.test.ts
```

### Regras das Camadas de Backend (Inversão de Dependências)
Para garantir que o código seja perfeito para o Subagente de QA mockar:
1. **Models (`models/`):** A fundação. Contém apenas tipagens TypeScript estáticas e esquemas de validação do Zod (ex: garantindo que o CNPJ tem 14 dígitos). Não importa bibliotecas externas complexas.
2. **Repositories (`repositories/`):** A única camada do sistema inteiro autorizada a conversar diretamente com o cliente do Supabase e rodar queries SQL. Se quisermos mudar o banco de dados no futuro, mexeremos apenas aqui. *QA:* O QA sempre deve fazer "mock" dos Repositories para testar as camadas superiores.
3. **Services (`services/`):** O coração da aplicação. Eles não sabem o que é React, formulários, ou HTTP. Eles simplesmente recebem parâmetros tipados, executam lógicas complexas (como OCR via Gemini) e mandam os `Repositories` salvarem os resultados. *QA:* Devem possuir os testes mais rigorosos, mockando APIs externas (Gemini/Resend) e chamadas aos repositórios.
4. **Controllers / Actions (`actions/` e `app/api/`):** Ponto de entrada do Frontend. As rotas recebem a requisição crua, validam os parâmetros usando os `Models`, extraem o usuário logado (Auth), e passam a bola para os `Services`. Elas tratam erros `try/catch` para devolver mensagens amigáveis à UI.

---

## Fluxo de Dados de Alto Nível (High-Level Data Flow)

1.  **Upload Público:** O Solicitante acessa a rota pública (`app/(public)/submit`), preenche o formulário e faz o upload. O Client Component chama uma Server Action.
2.  **Storage Inicial:** A Server Action usa a camada `lib/supabase/` para armazenar o arquivo no bucket `receipts` e inserir a requisição na tabela `RefundRequests` com status `PENDING`.
3.  **Triagem:** O Administrador (autenticado) acessa o Dashboard (`app/(auth)/admin`) e clica em "Processar".
4.  **Processamento (AI Extraction):** A ação aciona o `ai.service.ts`. O serviço pega a URL do arquivo no Supabase, envia para a API do Gemini via *Structured Output*, valida o JSON resultante e chama a `lib/supabase/` para atualizar os dados no banco.
5.  **Revisão e Disparo em Lote:** O Admin seleciona várias solicitações na tabela e aciona o envio. A Server Action consolida os dados, gera a lista e chama o `email.service.ts` para conectar com o Resend, anexar as imagens originais e emitir o e-mail consolidado.
