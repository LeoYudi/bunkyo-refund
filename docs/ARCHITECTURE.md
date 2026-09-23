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
*   **Linter e Formatter:** **Biome** (`biomejs`).
*   **Por que Biome:** Escrito em Rust, ele substitui a necessidade de termos o ESLint e o Prettier rodando juntos. Ele faz o trabalho dos dois em uma fração de segundo, mantendo todo o código gerado pelos agentes rigorosamente formatado e livre de anti-patterns de TypeScript.

---

## Fluxo de Dados de Alto Nível (High-Level Data Flow)

1.  **Upload Público:** O Solicitante (sem login) acessa a rota pública, preenche seus dados básicos e faz o upload da NF.
2.  **Storage Inicial:** Os dados são salvos na tabela de requisições no Supabase e o arquivo é armazenado no bucket com status pendente.
3.  **Triagem:** O Administrador (autenticado com Supabase Auth) loga no Dashboard e clica em "Aprovar" na solicitação desejada.
4.  **Processamento sob Demanda (AI Extraction):** Ao ser aprovado, o backend Next.js envia o arquivo para a API do Gemini. A IA extrai as entidades em formato JSON e o banco de dados é atualizado.
5.  **Revisão:** A interface do Admin é populada com os dados extraídos, permitindo correções manuais caso a IA tenha cometido erros de leitura.
6.  **Disparo em Lote:** O Admin seleciona várias solicitações na tabela e aciona a "Geração de Lote". O backend consolida os dados e chama a API do Resend para disparar um único e-mail financeiro agrupado.
