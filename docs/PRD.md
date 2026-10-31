# Product Requirements Document (PRD)

## 1. Visão Geral e Objetivo
O **Bunkyo Refund Project** é um sistema projetado para otimizar o fluxo de pedidos de reembolso. A nova arquitetura foca em remover o atrito do solicitante (que não precisa de senha) e dar poder de triagem e envio em lote (batching) ao administrador, utilizando Inteligência Artificial (Gemini) para ler os dados da nota apenas quando o pedido é previamente validado.

## 2. Personas (Usuários do Sistema)
1.  **Solicitante (Usuário Público/Anônimo):** Quem realizou a despesa. Não possui login. Acessa apenas uma página pública com um formulário para informar quem ele é e anexar o comprovante.
2.  **Administrador (Usuário Logado):** Quem faz a triagem. Acessa o Dashboard restrito, avalia os pedidos que chegam, aciona a IA para ler a nota e consolida pagamentos.

---

## 3. Fluxo Principal (User Journey)

1.  **Registro do Pedido (Público):** O Solicitante acessa a página pública (`/submit`), preenche apenas o seu Nome e anexa o arquivo (PDF/Imagem). O sistema salva com status `PENDENTE_TRIAGEM`.
2.  **Triagem do Admin:** O Administrador faz login no sistema e visualiza a caixa de entrada de requisições. Ele analisa por cima se o pedido faz sentido.
3.  **Aprovação & Mágica da IA:** O Administrador clica em "Aprovar para Leitura". Neste exato momento, o sistema envia o anexo para a API do Gemini. A IA lê a nota e preenche automaticamente o painel do Admin com Valor, CNPJ, etc. O status muda para `PROCESSADO`.
4.  **Consolidação e Disparo em Lote (Batch):** No fim do dia (ou da semana), o Administrador seleciona na tabela múltiplos pedidos `PROCESSADO` e clica em "Enviar ao Financeiro". O sistema consolida todos em um único e-mail estruturado via Resend.

---

## 4. Requisitos Funcionais

### 4.1. Portal Público (Formulário do Solicitante)
*   **Campos:** Nome de quem receberá o reembolso, Upload de Arquivo.
*   **Formatos do Upload:** `.pdf`, `.png`, `.jpg`, `.jpeg` (Máx 5MB).
*   **Interface:** Simples e Mobile-First.

### 4.2. Painel do Administrador (Dashboard)
*   Protegido por login (Supabase Auth).
*   **Tabela de Gestão:** Listagem com filtros de status (`PENDING`, `PROCESSING`, `DENIED`, `APPROVED`, `SENT`, `PAID`).
*   **Ação Individual:** Botão de editar.
*   **Ação em Massa (Bulk):** Checkboxes nas linhas da tabela para selecionar vários pedidos e botão "Enviar Pagamentos em Lote", assim como aprovar, negar e deletar.

### 4.3. Motor de Extração (Gemini)
O prompt de IA, acionado **apenas pelo Admin**, deve extrair as seguintes chaves JSON:
*   `issuer_name` (Nome/Razão Social do estabelecimento emissor)
*   `issuer_cnpj` (CNPJ do emissor)
*   `receiver_cnpj` (CNPJ do tomador/recebedor do serviço)
*   `total_value` (Valor Total)
*   `issue_date` (Data da emissão)
*   `issue_number` (Número da nota)
*   `description` (Resumo dos itens)

### 4.4. Módulo de E-mail (Lote - Padrão CJB)
O e-mail disparado ao setor financeiro será consolidado via Gmail API (OAuth) seguindo o modelo da Comissão de Jovens do Bunkyo (CJB):
*   **Assunto:** `Reembolso CJB - {Evento ou Data}`
*   **Corpo:** Saudação, parágrafo do evento/gastos, referência à planilha compartilhada e uma tabela HTML agrupada por pessoa (`Pessoa | PIX | Valor`), seguida do `"Valor total R$ ..."` em negrito e menção de aprovação (`@email`).
*   **Assinatura:** Nome, cargo, e-mail institucional e telefone.
*   **Anexos:** Todos os arquivos de notas fiscais baixados do Supabase Storage e anexados em MIME (`multipart/mixed`).

### 4.5. Exportação e Integração com Planilhas
O sistema deve fornecer opções para manipular os dados estruturados no formato de planilhas, facilitando o trabalho do time contábil/financeiro:
*   **Exportação Local:** Um botão no Dashboard para "Exportar Selecionados para CSV/Excel".
*   **Integração (Opcional Futura):** Capacidade de conectar a uma planilha existente (ex: Google Sheets via API) e adicionar os reembolsos aprovados como novas linhas automáticas.

### 4.6. Área de Configurações (`/admin/settings`)
O Administrador deve possuir uma página dedicada de configurações para definir os padrões de envio de e-mail, personalizar o formato/textos do template e visualizar um preview em tempo real antes dos disparos:
*   **Destinatários Padrão:**
    *   `Para (Destinatário Principal / Financeiro)`
    *   `Cc (Cópia)`
    *   `Cco (Cópia Oculta)`
    *   `E-mail para Aprovação (@Menção)`
*   **Textos e Formato do Template:**
    *   `Prefixo / Padrão do Assunto` (ex: `Reembolso CJB - `)
    *   `Saudação` (ex: `Pessoal, bom dia.`)
    *   `Texto Introdutório do Evento` (com suporte a placeholder `{eventDescription}`)
    *   `Texto da Planilha Compartilhada` (ex: `A planilha compartilhada "Solicitação de Reembolso de Despesas" foi preenchida com os valores e informações das notas que competem ao evento.`)
    *   `Texto de Solicitação de Aprovação` (ex: `Por gentileza, poderia revisar e aprovar esta solicitação?`)
    *   `Despedida` (ex: `Atenciosamente,`)
*   **Assinatura Padrão:**
    *   `Nome na Assinatura`, `Cargo na Assinatura`, `E-mail na Assinatura` e `Telefone na Assinatura`.
*   **Preview em Tempo Real (Live Email Preview):**
    *   Painel lado a lado exibindo em tempo real como o e-mail (cabeçalhos `Para`, `Cc`, `Cco`, `Assunto` e corpo HTML com dados de exemplo da tabela `Pessoa | PIX | Valor`) será renderizado à medida que o administrador edita os textos e configurações.
*   **Integração com `BatchPaymentDialog`:**
    *   Ao abrir o modal de envio em lote no Dashboard, todos os campos são pré-preenchidos automaticamente com as configurações salvas em `/admin/settings`.
