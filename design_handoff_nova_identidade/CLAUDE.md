# CLAUDE.md — ACS Expert frontend

Regras permanentes para trabalhar neste repositório.

## Stack
- React 18.3 + TypeScript + Vite 6
- Tailwind v4 (com `@theme inline` em `src/styles/theme.css`)
- Radix UI + shadcn/ui (componentes em `src/app/components/ui/` se existirem)
- MUI 7 usado pontualmente (ex: date pickers, se houver)
- Zustand para estado, Axios para HTTP, `idb` para IndexedDB offline
- React Router 7

## Identidade visual — NÃO MUDAR sem instrução
Tokens ficam em `src/styles/theme.css`. Paleta canônica:

| Token | Hex | Uso |
|---|---|---|
| `--acs-azul` | `#0B3A6F` | Primário institucional, headers, nav ativo |
| `--acs-azul-700` | `#104C8F` | Hover/estados |
| `--acs-azul-100` | `#D6E4F2` | Fundos sutis, chips info |
| `--acs-coral` | `#E76F4A` | CTA ação, FAB, acentos, risco em destaque |
| `--acs-verde` | `#2F9E6E` | Sucesso, risco baixo |
| `--acs-amar` | `#F2B134` | Atenção, risco médio |
| `--acs-vermelho` | `#C8364A` | Urgência, risco alto |
| `--acs-paper` | `#F5F1EB` | Fundo base da app |
| `--acs-paper-2` | `#EDE6DA` | Superfície secundária |
| `--acs-ink` | `#0E1726` | Texto primário |
| `--acs-ink-2` | `#3A4656` | Texto secundário |
| `--acs-ink-3` | `#6C7788` | Texto terciário / muted |

Tokens shadcn/Radix (`--primary`, `--background`, `--foreground`, `--muted`, `--destructive` etc.) são derivados dos tokens ACS acima. Nunca escrever hex direto em componentes — sempre usar classe utilitária ou token.

## Tipografia
- **Sora** → `font-display` → títulos, números grandes, headings
- **Inter** → `font-sans` (default) → UI, corpo, botões
- **JetBrains Mono** → `font-mono` → eyebrows UPPERCASE, metadados técnicos, percentuais, contadores

Regras de tamanho mínimo em mobile: corpo 14px, label 12px, eyebrow mono 10–11px com `letter-spacing: .14em`.

## Convenções de componentes
- Cards: `bg-white rounded-2xl` + sombra sutil `shadow-[0_1px_2px_rgba(10,20,40,.06)]`
- Botões primários: `bg-acs-azul text-white rounded-xl px-5 py-3 font-semibold`
- Botões ação (CTA coral): `bg-acs-coral text-white rounded-xl`
- Botões secundários: `border border-acs-azul text-acs-azul bg-transparent rounded-xl`
- Pills de risco: retângulos 6px de raio, 10px mono UPPERCASE, com dot colorido à esquerda
- FAB: 56×56, `rounded-2xl`, coral, sombra colorida `shadow-[0_8px_20px_rgba(231,111,74,.45)]`
- Ícones: `lucide-react` com `strokeWidth={1.8}` (default) ou `2.2` para destaques; nunca usar emoji

## Mobile-first
Target principal: 390×844 (iPhone 14). Toda tela deve funcionar em mobile antes de pensar em desktop. Hit targets mínimos 44×44px.

## O que NÃO fazer
- Não adicionar emojis
- Não desenhar SVG ornamental à mão — usar Lucide ou deixar placeholder
- Não usar cores fora da paleta ACS
- Não usar gradientes chamativos; o único gradiente permitido é o medidor de intensidade de sintomas (verde→amarelo→coral)
- Não trocar Zustand por outro state manager, nem reescrever services
- Não mexer em rotas ou em `routes.tsx` exceto se a tarefa pedir explicitamente
- Não reescrever arquivos inteiros quando editar alguns trechos resolve

## Ao fazer mudanças visuais
1. Cheque a tela alvo em `prototype/ACS Expert - App Nova Identidade.html`
2. Edite tokens em `src/styles/theme.css` primeiro — a maioria dos componentes vai atualizar sozinha
3. Rode `npm run dev` e valide em `390px` de largura primeiro
4. Para cada componente alterado: teste hover, active e estados `disabled`
