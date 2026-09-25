# Guia do Storybook

Este documento define os padrões para criação e estruturação de Stories no projeto Bunkyo Refund.

## Estrutura de Arquivos

- Os arquivos de stories devem ser criados no mesmo diretório do componente.
- O nome do arquivo deve seguir o padrão: `[nome-do-componente].stories.tsx`.
- Exemplo: Para `src/components/ui/button.tsx`, crie `src/components/ui/button.stories.tsx`.

## Template Padrão

Todo story deve utilizar a tipagem `@storybook/react` e exportar um `Meta` default e objetos `Story`.

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MeuComponente } from "./meu-componente";

const meta = {
  title: "UI/MeuComponente", // Agrupe componentes de UI sob a pasta "UI/"
  component: MeuComponente,
  tags: ["autodocs"],
  argTypes: {
    // Defina os controles para as props aqui
  },
} satisfies Meta<typeof MeuComponente>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Props padrão
  },
};
```

## Regras e Boas Práticas

1. **Autodocs**: Sempre inclua a tag `tags: ["autodocs"]` no objeto meta para gerar a documentação automaticamente.
2. **Title**: Utilize uma estrutura hierárquica clara, como `UI/Componente` ou `Features/Dominio/Componente`.
3. **Variações**: Crie exports diferentes para as principais variações de estado do componente (ex: Default, Outline, Destructive, Loading, etc).

## Páginas e Formulários Complexos

É fundamental que **páginas inteiras** (`page.tsx`) e **formulários complexos** (ex: `submit-refund-form.tsx`) também sejam documentados no Storybook. Isso permite visualização e testes de fluxos sem depender de um banco de dados rodando.

### Regras para Formulários
- Agrupe formulários usando a hierarquia `title: "Forms/[NomeDoForm]"`.
- Crie cenários (Stories) que representem o sucesso e as potenciais falhas de conexão simulando as `Server Actions` com atrasos artificiais (`setTimeout`).

```tsx
// Exemplo de Form
export const WithServerError: Story = {
  args: {
    onSubmitAction: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: false, error: "Erro de conexão simulado." };
    },
  },
};
```

### Regras para Páginas
- Agrupe páginas usando a hierarquia `title: "Pages/[NomeDaPagina]"`.
- Utilize `parameters: { layout: "fullscreen" }` para que a visualização da página não sofra padding das margens do Storybook.

```tsx
// Exemplo de Página
const meta = {
  title: "Pages/SubmitRefundPage",
  component: SubmitPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SubmitPage>;
```
