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
1. **Passo 1 (Branching e QA):** O Agente Principal cria uma nova branch a partir da `main` (ex: `feature/nome-da-tarefa`) e delega a tarefa para um subagente de Qualidade (QA). Este subagente deve ler as especificações (`PRD.md` / `ARCHITECTURE.md`) e **escrever os testes unitários primeiro** utilizando Vitest. Os testes irão falhar inicialmente.
2. **Passo 2 (Subagente Desenvolvedor):** O Agente Principal invoca o subagente Desenvolvedor (Dev). Este subagente deve ler os testes recém-criados e escrever a implementação final para fazer os testes passarem perfeitamente, garantindo os padrões de código (Shadcn, Biome).
3. **Passo 3 (Commit, PR e Notion):** Com os testes passando (`pnpm test`), o Desenvolvedor ou Agente Principal deve commitar o código na branch atual, fazer o push, e abrir um Pull Request (PR) contra a `main` para que o usuário revise. Somente após a criação do PR o card no Notion deve ser movido para "Reviewing" ou "Done".
