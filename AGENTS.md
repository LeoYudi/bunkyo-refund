<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---
# DIRETRIZES DO PROJETO E ORQUESTRAÇÃO DE AGENTES

## 0. REGRA DE OURO (NUNCA ASSUMA NADA)
* **O usuário é um Especialista em Desenvolvimento de Software.**
* **PROIBIÇÃO DE ASSUMIR:** Nenhum agente (nem o Agente Principal, nem o QA, nem o Dev) tem permissão para assumir decisões arquiteturais, de design ou de regra de negócio por conta própria em caso de ambiguidade.
* **PERGUNTE ANTES:** Se houver duas formas de implementar algo ou se faltar uma especificação técnica, você **DEVE** parar a execução e perguntar ao usuário para validar a decisão antes de escrever o código. Não tome liberdades técnicas sem aprovação.

## 1. Sincronização e Roadmap (Notion)
* **FONTE DA VERDADE:** O Roadmap e o status atual do projeto moram no banco de dados "Kanban board" no Notion do usuário (ID: `307f8698-a609-80e0-937e-dc5e621e71ab`).
* **NUNCA SE PERCA:** Sempre que a IA iniciar uma nova thread ou perder o contexto, deve ler a documentação (`docs/PRD.md` e `docs/ARCHITECTURE.md`) e checar o arquivo de tarefas (`task.md`) para saber exatamente em qual etapa o projeto se encontra.
* **ATUALIZAÇÃO AUTOMÁTICA NO NOTION:** É ESTRITAMENTE OBRIGATÓRIO que, ao iniciar ou concluir qualquer sub-tarefa, o Agente Principal utilize o `notion-mcp-server` para atualizar o Kanban do usuário (ex: mudar o `Status` para "In progress" ou "Done"). Nenhuma tarefa pode ser dada como concluída sem refletir no Notion.

## 2. Fluxo de Desenvolvimento TDD (Test-Driven Development)
Para garantir qualidade de código, **todas as tarefas de desenvolvimento de software** devem seguir um fluxo de orquestração de subagentes TDD e versionamento Git:
1. **Passo 1 (Branching e QA):** O Agente Principal cria uma nova branch a partir da `main` (ex: `feature/nome-da-tarefa`) e delega a tarefa para um subagente de Qualidade (QA). O QA **SEMPRE RODA NO MODELO `pro`**. Este subagente deve ler as especificações (`PRD.md` / `ARCHITECTURE.md`) e **escrever os testes unitários primeiro** utilizando Vitest. Os testes irão falhar inicialmente. **(NOVO) Autonomia do QA:** Se o subagente QA identificar edge cases não mapeados, falhas lógicas nos requisitos ou buracos na segurança durante a escrita dos testes, ele tem a obrigação de utilizar o `notion-mcp-server` para documentar o problema criando novos cards diretamente no Kanban (coluna "To-do").
2. **Passo 2 (Subagente Desenvolvedor):** O Agente Principal invoca o subagente Desenvolvedor (Dev). O Dev **SEMPRE RODA NO MODELO `flash_lite`**. Este subagente deve ler os testes recém-criados e escrever a implementação final para fazer os testes passarem perfeitamente, garantindo os padrões de código (Shadcn, Biome).
3. **Passo 3 (Commit, PR e Notion):** Com os testes passando (`pnpm test`), o Desenvolvedor ou Agente Principal deve commitar o código na branch atual seguindo rigorosamente a convenção do **Conventional Commits** (ver Seção 3), fazer o push, e abrir um Pull Request (PR) contra a `main` para que o usuário revise. Somente após a criação do PR o card no Notion deve ser movido para "Reviewing" ou "Done".

## 3. Padrão de Commits (Conventional Commits)
Todos os agentes (Principal, QA, Dev) **DEVEM** seguir rigorosamente a especificação do [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0-beta.4/) em todas as mensagens de commit.

### Estrutura da Mensagem:
```text
<tipo>[escopo opcional]: <descrição concisa>

[corpo opcional com motivação e contexto]

[rodapé(s) opcional(is), ex: referências a cards/issues ou BREAKING CHANGE]
```

### Tipos Permitidos:
* **`feat`**: Implementação de nova funcionalidade ou regra de negócio (ex: novo schema, action, service, endpoint, tela).
* **`test`**: Adição, refatoração ou correção de testes automatizados (obrigatório para commits do QA).
* **`fix`**: Correção de bug no código de produção.
* **`refactor`**: Refatoração de código que não altera comportamento público nem adiciona funcionalidade.
* **`style`**: Ajustes de formatação, lint, Biome, organização de imports (sem alteração de lógica).
* **`docs`**: Alterações exclusivamente em documentação (`PRD.md`, `ARCHITECTURE.md`, `README.md`, etc.).
* **`chore`**: Tarefas de manutenção de build, pacotes, dependências (`package.json`, pnpm) ou configurações de tooling.
* **`perf`**: Alteração de código com foco estrito em otimização de performance.
* **`ci`**: Alterações em pipelines de integração/entrega contínua ou automações.

### Escopos Recomendados do Projeto (alinhados com DDD):
* `(models)`: Modelos de domínio, tipos e schemas Zod (`src/models/`).
* `(repositories)`: Camada de persistência e acesso ao Supabase (`src/repositories/`).
* `(services)`: Regras de negócio e integrações externas (`src/services/`).
* `(actions)`: Server Actions e controllers (`src/actions/`).
* `(components)` ou `(ui)`: Componentes React e shadcn/ui.
* `(auth)`: Fluxos de autenticação e proteção de rotas/middleware.
* `(db)`: Migrations SQL, RLS, triggers ou schemas do banco.
* `(config)`: Arquivos de configuração do projeto (`vitest.config.ts`, `biome.json`, etc.).

### Regras de Ouro de Formatação:
1. O `<tipo>` e `<escopo>` devem ser sempre em letras minúsculas.
2. A `<descrição>` deve ser concisa, no modo imperativo ("adicionar" / "implementar" / "corrigir", em português ou inglês consistente no projeto) e **NUNCA** terminar com ponto final.
3. Se houver Breaking Changes, incluir `!` antes dos dois pontos (ex: `feat(models)!: ...`) ou indicar `BREAKING CHANGE:` no rodapé.
4. Exemplos práticos:
   * QA criando testes: `test(models): adicionar testes unitários para schemas zod de refund`
   * Dev implementando: `feat(models): implementar validações zod para refund domain`
   * Correção: `fix(repositories): corrigir query de busca por status no refund repository`
   * Linting: `style(models): formatar código com biome`

## 4. Padrão de Pull Requests (PRs)
Sempre que um agente ou desenvolvedor abrir um Pull Request via GitHub CLI, a descrição (body) deve seguir o seguinte template para garantir clareza nas revisões, e **LABELS** correspondentes ao tipo/escopo devem ser aplicadas (ex: `--label "enhancement"` ou `--label "feat,models"`).

### Estrutura do PR:
**Título:** `<tipo>[escopo opcional]: <descrição concisa>` (O mesmo padrão do Conventional Commits)

**Corpo (Body):**
```markdown
## 🎯 Objetivo
Resumo conciso sobre o que este PR resolve ou qual feature ele adiciona.

## 🛠️ Mudanças Realizadas
- Detalhe 1 (ex: Adição do schema `CreateRefundSchema`)
- Detalhe 2 (ex: Testes unitários cobrindo X e Y)

## 🧪 Como foi testado?
- [ ] Testes unitários (`vitest`) implementados e passando.
- [ ] Testes de integração/E2E (se aplicável).
- [ ] Validação manual.

## 📌 Notion / Roadmap
- Referência ao card no Notion: [ID ou Nome da Tarefa]
```
