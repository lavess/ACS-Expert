# Componentes — specs

Para cada um: classes Tailwind, props, comportamento. Implementar como componentes React em `src/app/components/` (ou `ui/` se já houver pasta shadcn).

## RiskPill

Badge pequeno de risco clínico com dot colorido.

```tsx
type RiskKind = 'urgente' | 'atencao' | 'info' | 'baixo';

const RISK_CFG: Record<RiskKind, { bg: string; fg: string; dot: string; label: string }> = {
  urgente: { bg: 'bg-acs-vermelho-100', fg: 'text-acs-vermelho', dot: 'bg-acs-vermelho', label: 'URGENTE' },
  atencao: { bg: 'bg-acs-amar-100',     fg: 'text-[#A3740A]',   dot: 'bg-acs-amar',     label: 'ATENÇÃO' },
  info:    { bg: 'bg-acs-azul-100',     fg: 'text-acs-azul',    dot: 'bg-acs-azul-700', label: 'INFO' },
  baixo:   { bg: 'bg-acs-verde-100',    fg: 'text-[#1E6B48]',   dot: 'bg-acs-verde',    label: 'ROTINA' },
};

export function RiskPill({ kind, children }: { kind: RiskKind; children?: React.ReactNode }) {
  const c = RISK_CFG[kind];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold uppercase tracking-[.1em] ${c.bg} ${c.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {children ?? c.label}
    </span>
  );
}
```

## PrimaryButton / SecondaryButton / CoralButton

```tsx
// Primary (azul)
className="bg-acs-azul hover:bg-acs-azul-900 text-white font-semibold rounded-xl px-5 py-3 text-sm transition"

// Secondary (outline)
className="border border-acs-azul text-acs-azul bg-transparent hover:bg-acs-azul-100 font-semibold rounded-xl px-5 py-3 text-sm transition"

// Coral (CTA de ação)
className="bg-acs-coral hover:brightness-95 text-white font-semibold rounded-xl px-5 py-3 text-sm transition shadow-[0_4px_12px_rgba(231,111,74,.3)]"
```

Altura mínima 44px. Se usar shadcn `<Button>`, customizar o `variant="default"` para usar `bg-primary` (já aponta pro azul via tokens), e adicionar variant `"coral"` na CVA.

## Card

```tsx
<div className="card-acs p-4">
  {/* ... */}
</div>
```

A utilitária `.card-acs` já está em `theme.css`: branco, `rounded-2xl`, sombra sutil.

## AlertCard (home "Requer atenção")

Card com borda esquerda colorida pelo nível de risco.

```tsx
<div className={`bg-white rounded-xl p-3.5 flex items-start gap-3 border-l-[3px] ${borderByKind[kind]}`}>
  <div className="flex-1">
    <RiskPill kind={kind} />
    <div className="text-sm font-semibold text-acs-ink mt-1.5 leading-tight">{name}</div>
    <div className="text-xs text-acs-ink-3 mt-0.5">{detail}</div>
  </div>
  <ChevronRight size={16} className="text-acs-ink-4" />
</div>
```

## BottomNav

Fixo no rodapé, 5 itens: Início, Pacientes, Agenda, Encaminhar, Alertas. O ativo ganha:
- Cor azul no ícone e label
- Barra de 28×3px acima, 11px do topo, arredondada
- Label em `font-semibold`

Use ícones Lucide: `Home`, `Users`, `Route`, `Send`, `Bell`.

## FAB coral

```tsx
<button className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl fab-coral flex items-center justify-center">
  <Plus size={24} strokeWidth={2.2} />
</button>
```

## PriorityCard (resultado da triagem)

Card grande com cor de fundo sólida por nível:
- Alta: `bg-acs-vermelho`
- Média: `bg-acs-amar`
- Baixa: `bg-acs-verde`

Todos com texto branco, `rounded-[22px]`, padding 20px. Badge no topo em `bg-black/20` com nome do nível em mono uppercase. Título em Sora 30px.

## ProgressBar / ProbabilityBar

Track fino 5–6px, `bg-acs-paper-2`, fill `rounded-full` com cor do risco.

## Symptom intensity gradient

```css
background: linear-gradient(90deg, #2F9E6E 0%, #F2B134 50%, #E76F4A 100%);
```

Aplicar na barra de intensidade 0–10. O "polegar" do slider (thumb do Radix) é um círculo branco 20px com `shadow-md`.

## Offline banner

```tsx
<div className="flex items-center gap-2.5 bg-acs-amar-100 text-[#7A5310] rounded-xl px-3.5 py-2.5 text-xs font-medium">
  <WifiOff size={16} />
  <span className="flex-1">Modo offline — {n} triagens aguardando sincronização</span>
  <RefreshCw size={14} />
</div>
```

Renderizar condicionalmente: `const isOnline = useOnline(); const queueCount = useOfflineQueue();`
