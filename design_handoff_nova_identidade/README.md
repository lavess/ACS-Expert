# Handoff — Nova Identidade Visual ACS Expert

**Para:** Claude Code / desenvolvedor(a) frontend
**Codebase alvo:** `frontend/` (React 18 + Vite 6 + TypeScript + Tailwind v4 + Radix/shadcn + MUI)
**Escopo:** Substituir a identidade visual atual (azul saturado `#0066CC` + Roboto) pela nova identidade ACS Expert (azul profundo `#0B3A6F` + coral `#E76F4A` + bege `#F5F1EB` + Sora/Inter) em toda a aplicação, mantendo comportamento, rotas e estrutura de pastas.

---

## 📦 O que há neste pacote

| Arquivo | Uso |
|---|---|
| `README.md` | Este documento — leitura primeiro |
| `CLAUDE.md` | Regras permanentes para o Claude Code operar no repo |
| `PROMPT.md` | Prompt pronto para colar na primeira mensagem do Claude Code |
| `tokens/theme.css` | Novo `src/styles/theme.css` — pronto para substituir o existente |
| `tokens/fonts.css` | Novo `src/styles/fonts.css` — importa Sora + Inter + JetBrains Mono |
| `tokens/tailwind-classes.md` | Tabela de-para de classes Tailwind antigas → novas |
| `migration/MIGRATION_PLAN.md` | Ordem de migração, arquivo por arquivo |
| `migration/COMPONENTS.md` | Specs de Button, Badge, Card, Nav, Pill etc. |
| `assets/Logo.tsx` | Componente React do novo logo (pulso + território) |
| `assets/logo.svg` | SVG solto do logo |
| `prototype/ACS Expert - App Nova Identidade.html` | Protótipo hi-fi — referência visual final |
| `prototype/ACS Expert - Nova Identidade Visual.html` | Deck da identidade (princípios, paleta, tipografia, aplicações) |

---

## 🎯 Regras de ouro

1. **Os HTMLs em `prototype/` são REFERÊNCIAS**, não código para copiar. A tarefa é reproduzir a aparência no React existente, usando os componentes shadcn/Radix/MUI que já estão no repo.
2. **Não quebrar comportamento.** Formulários, rotas, stores Zustand, services Axios, offline queue — tudo permanece. Só mudam estilos, tokens, tipografia, logo e componentes de UI "burros".
3. **Tokens primeiro.** Comece substituindo `src/styles/theme.css` e `src/styles/fonts.css`. A maior parte do app já consome tokens Radix (`bg-primary`, `text-foreground`…) e vai pegar a nova identidade automaticamente.
4. **Português Brasil.** Copys existentes em pt-BR — manter. Não renomear rotas.
5. **Fidelidade alta.** O protótipo é hi-fi. Cores, pesos de fonte, raios e espaçamentos devem bater.

---

## 🎨 Resumo da nova identidade

**Paleta (hex):**
- Azul Profundo `#0B3A6F` — primário institucional
- Coral Cuidado `#E76F4A` — ação, CTA secundário, acentos
- Verde Vivo `#2F9E6E` — sucesso / baixo risco
- Amarelo `#F2B134` — atenção / médio risco
- Vermelho `#C8364A` — urgência / alto risco
- Bege Campo `#F5F1EB` (fundo) / `#EDE6DA` (superfície 2)
- Tinta `#0E1726` (texto) / `#3A4656` / `#6C7788` (secundários)

**Tipografia:**
- **Sora** — títulos e display (400, 500, 600, 700)
- **Inter** — UI e corpo (400, 500, 600, 700)
- **JetBrains Mono** — eyebrows, metadados, números técnicos (400, 500, 600)

**Forma:**
- Cantos generosos: botões/inputs `rounded-xl` (12–14px), cards `rounded-2xl` (16–18px)
- Sombras sutis: `0 1px 2px rgba(10,20,40,.06)` para cards; nada de sombra "dramática"
- Bordas finas: `rgba(28,42,61,.08)` (line) e `rgba(28,42,61,.16)` (line-strong)

**Tom:**
- "Cuidado que anda junto."
- Humano, confiável, de campo, claro. Sem jargão, sem excesso de ícones.

---

## 🗺️ Arquivos-alvo no codebase

```
frontend/
├── src/
│   ├── styles/
│   │   ├── theme.css        ← SUBSTITUIR (tokens)
│   │   ├── fonts.css        ← SUBSTITUIR (Sora + Inter + JB Mono)
│   │   └── index.css        ← revisar (apenas resets)
│   ├── assets/
│   │   └── logo.png         ← SUBSTITUIR por novo logo (ver assets/)
│   ├── app/
│   │   └── components/      ← revisar layout shell, topbar, bottom nav
│   ├── features/
│   │   ├── auth/            ← tela de login (ver prototype screen 01)
│   │   ├── dashboard/       ← home (ver prototype screen 02)
│   │   ├── pacientes/       ← lista + perfil (ver prototype screen 03)
│   │   ├── triagem/         ← passos 1-3 (ver screens 04-05)
│   │   ├── agenda/          ← rota do dia (ver screen 06)
│   │   ├── visitas/
│   │   ├── encaminhamentos/
│   │   └── alertas/
```

---

## ✅ Definition of Done

- [ ] `theme.css` e `fonts.css` substituídos
- [ ] Sora carregada; títulos usando `font-display`/Sora; corpo Inter
- [ ] Logo antigo (`src/assets/logo.png`) substituído pelo novo (ícone + wordmark SVG)
- [ ] Todas as telas rodando no novo tema sem warnings no console
- [ ] Paleta de risco (high/medium/low) atualizada para `#C8364A / #F2B134 / #2F9E6E`
- [ ] Cor primária `#0B3A6F` em botões, nav ativa e headers
- [ ] Coral `#E76F4A` em FAB "+" (cadastro), CTAs de ação e destaques
- [ ] Fundo da app = `#F5F1EB` (paper), cards brancos
- [ ] Fontes Sora/Inter/JB Mono instaladas (via Google Fonts ou `@fontsource-*`)
- [ ] Protótipo HTML batendo em 95%+ com a tela renderizada no navegador

---

Boa! Qualquer ambiguidade, abrir o deck `prototype/ACS Expert - Nova Identidade Visual.html` e o canvas `prototype/ACS Expert - App Nova Identidade.html` — eles são a fonte da verdade.
