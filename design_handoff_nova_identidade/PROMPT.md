# Prompt para o Claude Code

Cole o conteúdo abaixo como **primeira mensagem** de uma nova conversa no Claude Code, com o repositório `frontend/` aberto.

---

```
Estou te entregando um handoff de nova identidade visual para este repositório
(ACS Expert — app mobile-first para agentes comunitários de saúde).

Leia, na ordem:
1. `design_handoff_nova_identidade/README.md`
2. `design_handoff_nova_identidade/CLAUDE.md` — copie ele para a raiz do repo como
   `CLAUDE.md` (ou mescle se já existir um) antes de começar
3. `design_handoff_nova_identidade/migration/MIGRATION_PLAN.md`
4. `design_handoff_nova_identidade/migration/COMPONENTS.md`
5. `design_handoff_nova_identidade/tokens/tailwind-classes.md`

Os arquivos em `design_handoff_nova_identidade/prototype/*.html` são REFERÊNCIAS
visuais (abra no navegador). A tarefa é reproduzir aquela aparência dentro do
React/Tailwind/shadcn/Radix que já existe em `frontend/src/`.

## Execução

Siga o `MIGRATION_PLAN.md` fase por fase. Não pule fases.

**Fase 0 — Tokens e fontes (fazer primeiro, de uma vez):**
- Substitua `frontend/src/styles/theme.css` pelo conteúdo de
  `design_handoff_nova_identidade/tokens/theme.css`
- Substitua `frontend/src/styles/fonts.css` pelo conteúdo de
  `design_handoff_nova_identidade/tokens/fonts.css`
- Rode `npm run dev` e valide que a app sobe. Me mostre um screenshot do Dashboard
  e do Login antes de seguir.

**Fase 1 — Logo e brand shell:**
- Substitua `frontend/src/assets/logo.png` pelo novo SVG
  (`design_handoff_nova_identidade/assets/logo.svg`)
- Crie `frontend/src/app/components/brand/Logo.tsx` a partir de
  `design_handoff_nova_identidade/assets/Logo.tsx`
- Ache todos os usos do logo antigo e troque pelo novo componente

**Fase 2 a 7 — Features:**
Migre na ordem: auth → layout shell (bottom nav) → dashboard → pacientes →
triagem → agenda/encaminhamentos/alertas. Em cada uma:
1. Abra o protótipo HTML na tela correspondente
2. Ajuste classes/estilos/estrutura para bater com o mock
3. Valide comportamento (rotas, forms, stores inalterados)
4. Me mostre screenshot lado-a-lado (protótipo vs sua implementação) antes
   de marcar a fase como concluída

## Regras

- NÃO mude comportamento, rotas, stores, services ou types
- NÃO reescreva arquivos inteiros — faça edits cirúrgicos
- NÃO adicione emojis nem SVGs decorativos criados do zero
- Use APENAS tokens ACS — nunca hex direto em componentes
- Se houver conflito entre o protótipo e o código existente, PERGUNTE antes
  de decidir
- Commit ao fim de cada fase com mensagem `style(identity): phase N — <resumo>`

Comece pela Fase 0. Confirme que leu todos os docs antes de começar.
```

---

## Dica de uso

Quando Claude Code terminar cada fase, peça:
- `npm run dev` e um screenshot da tela migrada
- `npm run build` para garantir que não há erros de TS
- Diff resumido do que mudou

Se algo parecer errado, cole o protótipo HTML no prompt como anexo visual para ele comparar.
