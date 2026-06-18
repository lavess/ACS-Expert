# De-para de classes Tailwind

Quando encontrar no código antigo → substitua por:

## Cores

| Antiga | Nova | Notas |
|---|---|---|
| `bg-[#0066CC]` · `bg-acs-primary` | `bg-acs-azul` ou `bg-primary` | azul institucional |
| `bg-[#0052A3]` · `bg-acs-primary-dark` | `bg-acs-azul-900` | hover/pressed |
| `bg-[#E8F0FE]` · `bg-acs-primary-light` | `bg-acs-azul-100` | chip info, tags |
| `bg-[#F6F9FF]` · `bg-acs-bg` | `bg-acs-paper` ou `bg-background` | fundo da app |
| `bg-white` · `bg-acs-surface` | `bg-white` ou `bg-card` | cartões |
| `text-[#0B1220]` · `text-acs-text` | `text-acs-ink` ou `text-foreground` | |
| `text-[#64748B]` · `text-acs-text-muted` | `text-acs-ink-3` ou `text-muted-foreground` | |
| `border-[#DBEAFE]` · `border-acs-border` | `border-acs-line` ou `border-border` | |
| `bg-[#EF4444]` · `bg-acs-danger` · `bg-acs-risk-high` | `bg-acs-vermelho` | **muda o tom** |
| `bg-[#F59E0B]` · `bg-acs-warning` · `bg-acs-risk-medium` | `bg-acs-amar` | |
| `bg-[#10B981]` · `bg-acs-success` · `bg-acs-risk-low` | `bg-acs-verde` | |

**Acentos/CTA secundário**: adotar `bg-acs-coral` / `text-acs-coral` onde antes não havia acento. Use para:
- FAB "+" de cadastro
- Botão "Registrar encaminhamento" no resultado da triagem
- Badges URGENTE em cards destacados
- Links de ação em hero cards azuis

## Raios

| Antiga | Nova |
|---|---|
| `rounded-md` (6px) | `rounded-lg` (14px) |
| `rounded-lg` (8px) | `rounded-xl` (18px) |
| `rounded-xl` (12px) | `rounded-2xl` (22px) |

Em geral, **suba um nível** — a identidade pede cantos mais generosos. Não use `rounded-full` exceto para pills/chips/avatares.

## Sombras

| Antiga | Nova |
|---|---|
| `shadow-sm`, `shadow-md` | `shadow-[0_1px_2px_rgba(10,20,40,.06)]` (cards) |
| `shadow-lg`, `shadow-xl` | `shadow-[0_8px_20px_rgba(10,20,40,.18)]` (modals, FAB) |
| FAB/CTA coral | `shadow-[0_8px_20px_rgba(231,111,74,.45)]` |

Remover sombras grandes e "dramáticas" de cards comuns.

## Tipografia

| Elemento | Classes |
|---|---|
| Títulos de tela (H1) | `font-display font-semibold text-2xl md:text-3xl tracking-tight` |
| Seção (H2) | `font-display font-semibold text-lg tracking-tight` |
| Corpo | `font-sans text-sm` (default) |
| Eyebrow / label técnico | `font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3 font-semibold` |
| Números grandes / métricas | `font-display font-semibold text-3xl tracking-tight` |
| Texto muted | `text-acs-ink-3` ou `text-muted-foreground` |

## Spacing

Mobile-first, denso mas confortável:
- Padding interno de cards: `p-4` (16px)
- Gap entre cards empilhados: `gap-3` (12px)
- Padding horizontal da tela: `px-5` (20px)
- Altura de hit target mínima: `min-h-11` (44px)

## Ícones

Substituir uso de emoji ou `@mui/icons-material` por `lucide-react`:

```tsx
import { Home, Users, Route, Send, Bell } from 'lucide-react';

<Home size={22} strokeWidth={1.8} className="text-acs-ink-3" />
```

Para ícone ativo: `strokeWidth={2}` e `text-acs-azul`.
