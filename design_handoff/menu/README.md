# Menu Lateral — Pacote de handoff

Drawer mobile + sidebar desktop responsivos, na nova identidade do ACS Expert.

## O que tem aqui

| Arquivo | Para quê |
|---------|----------|
| **menu-handoff.html** | Protótipo visual interativo. Abra para ver os dois layouts lado a lado, anatomia, estados e cards de handoff. |
| **menu-handoff/PROMPT.md** | Prompt pronto para colar no Claude Code — manda implementar tudo no repo. |
| **menu-handoff/SPEC.md** | Especificação técnica: árvore de componentes, props, tokens, comportamentos, a11y, edge cases. |
| **menu-handoff/atoms.jsx** | Átomos compartilhados (Icon, LogoMark, IOSStatusBar, Segmented, mock data). |
| **menu-handoff/drawer.jsx** | Implementação React/JSX dos componentes do menu — usar como referência de estilo. |
| **menu-handoff/dashboard-mobile.jsx** + **dashboard-desktop.jsx** | Mockups das telas-base (apenas para contexto visual; não fazem parte do escopo do menu). |
| **menu-handoff/app.jsx** | Workshop view e tweak panel. |

## Como usar

1. Abra **menu-handoff.html** no navegador para ver o protótipo + spec visual.
2. Copie o conteúdo de **PROMPT.md**, cole numa nova sessão do Claude Code dentro do repo do ACS Expert.
3. O Claude Code vai ler **SPEC.md** e os JSX de referência para guiar a implementação em TS/React.

## Decisões já tomadas

- Drawer mobile a **86% de largura** com cantos arredondados (variante `'85'`). Variante `full` disponível.
- Sidebar desktop **252px**, fixa, não colapsa.
- Conteúdo dos dois é **idêntico** — muda só hierarquia tipográfica e densidade.
- Bottom nav do mobile **permanece** — drawer é navegação secundária.
- Cabeçalho com avatar + UBS · microárea ativa · atalhos rápidos · navegação · status de sync · logout.
