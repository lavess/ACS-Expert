# Prompt para Claude Code — Menu Lateral (drawer mobile + sidebar desktop)

> Cole este prompt em uma nova sessão do Claude Code aberta no repo do ACS Expert. Os arquivos de referência (protótipo + spec) estão em `design_handoff/menu/`.

---

## Contexto

Estou implementando o **menu lateral** do app ACS Expert, no design renovado da identidade visual.

**Documentos de referência** (leia ANTES de começar):
- `design_handoff/menu/SPEC.md` — especificação técnica completa.
- `design_handoff/menu/menu-handoff.html` + pasta `menu-handoff/` — protótipo visual e código React (JSX) de referência.
- `design_handoff_nova_identidade/tokens/theme.css` + `tokens/fonts.css` — tokens de cor e tipografia já existentes.
- `design_handoff_nova_identidade/migration/COMPONENTS.md` — convenções de componente do projeto.

**Stack do projeto:** React + TypeScript + Tailwind. Componentes em `frontend/src/app/components/`. Navegação com React Router.

---

## Escopo

Implementar a navegação secundária responsiva. **Mesmo conteúdo, dois layouts:**

- **Mobile (`< 1024px`)** — Drawer overlay. Aberto por botão hambúrguer no app bar **e** por swipe da borda esquerda.
- **Desktop (`≥ 1024px`)** — Sidebar fixa de 252px à esquerda. Não colapsa.

A bottom nav (5 abas) **continua existindo** no mobile — não é substituída pelo drawer. O drawer é **navegação secundária + perfil + atalhos**.

---

## Arquivos a criar

```
frontend/src/app/components/SideNav/
├── SideNav.tsx                   ← componente raiz, recebe `layout` prop
├── MobileDrawer.tsx              ← wrapper com overlay + animação + a11y (envolve SideNav)
├── parts/
│   ├── AgenteHero.tsx            ← header com avatar + UBS (variantes mobile/desktop)
│   ├── MicroareaSwitcher.tsx     ← chip + dropdown
│   ├── Atalhos.tsx               ← 2 cards (triagem coral · cadastro azul)
│   ├── NavList.tsx               ← lista de itens com badge
│   ├── StatsBlock.tsx            ← visitas / triagens / alertas da semana
│   ├── SyncStatus.tsx            ← banner de sincronização
│   └── LogoutButton.tsx          ← botão isolado com confirmação
├── hooks/
│   ├── useEdgeSwipe.ts           ← detecta swipe da borda esquerda → abre drawer
│   └── useMediaQuery.ts          ← se ainda não existir no projeto
├── nav-config.ts                 ← arrays NAV_ITEMS e SECONDARY_ITEMS
└── types.ts                      ← AcsUser, SyncState, NavItem, NavId
```

E **modificar:**

- `frontend/src/app/AppShell.tsx` (ou equivalente) — montar `<SideNav layout="desktop">` lateral em ≥1024px e `<MobileDrawer>` controlado por estado em <1024px.
- `frontend/src/app/components/AppBar.tsx` — adicionar botão hambúrguer que dispara `setDrawerOpen(true)`. Esconder em desktop.

---

## Contratos críticos (não interprete diferente da spec)

1. **Comportamento de fechamento do drawer:** click no overlay, tecla `Esc`, click no X, ou click em qualquer item de nav que dispare navegação. Trap de foco enquanto aberto. `body` com scroll travado.
2. **Variantes de largura:** suportar prop `variant: '85' | 'full'`. Default `'85'` (86% da viewport, com border-radius à direita).
3. **Microárea switcher:** dropdown inline (não modal). Item ativo com check + bg `azul-050`.
4. **Atalhos disparam handler + fecham drawer.** Não navegue diretamente lá dentro — o pai decide.
5. **Estado ativo da nav:** fundo sólido `--acs-azul`, texto branco. Badge `urgent` em coral; senão, neutro.
6. **Não use `scrollIntoView`** em lugar nenhum (regra do projeto). Use refs + `scrollTop` se precisar.

---

## A11y obrigatório

- `<MobileDrawer>` = `role="dialog" aria-modal="true"`. Foco entra no botão fechar; trap ativo; `Esc` fecha.
- Hambúrguer com `aria-expanded` + `aria-controls`.
- `<aside>` desktop com `aria-label="Navegação principal"`.
- Item ativo com `aria-current="page"`.
- Badge "3" tem `aria-label="3 alertas pendentes"` no item de Alertas.
- Contraste validado: ativo azul/branco, atalho coral/branco.

---

## Tokens — NUNCA hard-code cores

Lê tudo de `theme.css`. Mapeamento por uso está no `SPEC.md` seção 4. Resumo crítico:

- Fundo do drawer mobile: `var(--acs-paper)`
- Hero do agente (gradient): `var(--acs-azul)` → `var(--acs-azul-700)`
- Item ativo: `var(--acs-azul)` + `#fff`
- Atalho coral: `var(--acs-coral)` (icon bg) + `var(--acs-coral-100)` (card bg) + `var(--acs-coral-700)` (text)
- Sync online: `var(--acs-verde-100)` + `var(--acs-verde-700)`
- Sync offline/pending: `var(--acs-amar-100)` + `var(--acs-amar-700)`

---

## Mock data inicial

Para a navegação funcionar isolada antes da integração com a API:

```ts
// nav-config.ts
import { Home, Calendar, Users, ClipboardCheck, BadgeAlert, Settings, CircleHelp, Info } from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  { id: 'inicio',    label: 'Início',    icon: Home },
  { id: 'agenda',    label: 'Agenda',    icon: Calendar,        badge: '4 hoje' },
  { id: 'pacientes', label: 'Pacientes', icon: Users },
  { id: 'triagens',  label: 'Triagens',  icon: ClipboardCheck },
  { id: 'alertas',   label: 'Alertas',   icon: BadgeAlert,      badge: 3, urgent: true },
];

export const SECONDARY_ITEMS: NavItem[] = [
  { id: 'config', label: 'Configurações', icon: Settings },
  { id: 'ajuda',  label: 'Ajuda',         icon: CircleHelp },
  { id: 'sobre',  label: 'Sobre o app',   icon: Info },
];
```

User mock e sync mock devem vir de hooks `useCurrentAcs()` e `useSyncStatus()` que **já existem** ou que você criará com `// TODO: ligar com API` — não chame fetch direto.

---

## Critérios de aceite (checklist)

Quando terminar, valide:

- [ ] Em mobile (375px): drawer abre por hambúrguer e por swipe da borda esquerda.
- [ ] Em mobile: drawer fecha por overlay/Esc/X/item-clicado.
- [ ] Em mobile: bottom nav continua visível normalmente quando drawer fechado.
- [ ] Em desktop (1280px): sidebar fixa visível à esquerda; nenhum hambúrguer.
- [ ] Resize 1023→1024px: drawer some, sidebar aparece (e vice-versa); sem flash de conteúdo.
- [ ] Item ativo refletido visualmente nos dois layouts.
- [ ] Microárea: dropdown abre/fecha; seleção dispara `onMicroareaChange`.
- [ ] Atalho coral leva pra `/triagem/nova`; atalho azul pra `/pacientes/novo`.
- [ ] Logout abre `<Dialog>` de confirmação antes de sair.
- [ ] SyncStatus muda visual entre 3 estados (online-zero, online-pending, offline).
- [ ] Lighthouse a11y ≥ 95 na rota com drawer aberto.
- [ ] Storybook (se o projeto tem) com stories para `SideNav`, `MobileDrawer`, e cada `parts/*`.
- [ ] Sem `scrollIntoView` no código.
- [ ] Sem cores hard-coded — só tokens.

---

## Não faça

- ❌ Não substitua a bottom nav. Coexistem.
- ❌ Não use posições absolutas para a sidebar desktop — é parte do layout flex normal.
- ❌ Não anime a sidebar desktop (entrada/saída). Ela é estática.
- ❌ Não invente itens de menu fora dos definidos no SPEC.
- ❌ Não duplique tokens em variáveis JS — use `var(--…)` em `style` ou classes Tailwind que já mapeiam.

---

Quando terminar, faça commit em branches separadas:
1. `feat/sidenav-shared-parts` — todos os `parts/*` + tipos.
2. `feat/sidenav-mobile-drawer` — `MobileDrawer` + hambúrguer no AppBar.
3. `feat/sidenav-desktop` — sidebar persistente + ajuste do shell.

Abra PR encadeado.
