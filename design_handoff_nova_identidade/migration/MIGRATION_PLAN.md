# Plano de Migração

Faça **uma fase por vez**. Só avance depois de validar a anterior.

## Fase 0 — Fundamentos (tokens + fontes)
**Saída esperada:** app sobe, cores e fontes trocaram globalmente sem quebrar nada.

1. Substituir `frontend/src/styles/theme.css` por `../tokens/theme.css`
2. Substituir `frontend/src/styles/fonts.css` por `../tokens/fonts.css`
3. Se houver `@import` do antigo Google Fonts em outro lugar (checar `index.html` e `main.tsx`), remover
4. `npm run dev` — validar:
   - Fundo da app é bege `#F5F1EB` (não mais azul-claríssimo)
   - Títulos em Sora, corpo em Inter
   - Botões primários agora azul profundo `#0B3A6F`

## Fase 1 — Logo
1. Copiar `../assets/logo.svg` para `frontend/src/assets/logo.svg`
2. Criar `frontend/src/app/components/brand/Logo.tsx` (ver `../assets/Logo.tsx`)
3. Apagar `frontend/src/assets/logo.png`
4. Buscar `import.*logo.png` no repo e trocar pelo novo componente
5. Onde for só ícone pequeno (header da sidebar, favicon), usar `<Logo variant="mark" />`; onde for marca completa (login, sobre), `<Logo variant="full" />`

## Fase 2 — Layout shell
Arquivos prováveis: `src/app/App.tsx`, `src/app/components/Layout*.tsx`, qualquer `BottomNav*.tsx` / `TopBar*.tsx`.

- Topbar/header em `bg-white` com border-bottom `border-acs-line`
- Bottom nav com 5 itens (ver `COMPONENTS.md` → `BottomNav`)
- Avatar do usuário com gradiente azul→verde quando não houver foto

## Fase 3 — Auth (login)
Referência: `prototype/ACS Expert - App Nova Identidade.html`, tela 01.
- Headline grande em Sora "Cuidado *que anda junto.*"
- Input focado com `ring-2 ring-acs-azul`
- Botão primário full-width azul
- Chip "funciona offline" no rodapé em `bg-acs-paper-2`

## Fase 4 — Dashboard
Referência: tela 02.
- Hero card azul com a rota do dia (número grande em Sora)
- Banner offline em amarelo (quando `!useOnline()`)
- Cards de métrica em grid 2×N
- Lista "Requer atenção" com `AlertCard` (ver `COMPONENTS.md`)

## Fase 5 — Pacientes
Referência: tela 03.
- Input de busca com ícone Lucide `Search`
- Chips de filtro horizontais scrolláveis; o ativo é `bg-acs-ink text-acs-paper`
- Lista com `PatientRow` (avatar iniciais em paper-2, `<RiskPill />`, tag, timestamp)
- FAB `+` coral no canto inferior direito

## Fase 6 — Triagem
Referências: telas 04 e 05.
- Stepper 3 passos no topo (barras finas)
- Chips de sintoma com slider de intensidade 0–10 + barra gradiente verde→amarelo→coral
- Acordeão Radix para grupos
- Resultado com priority card (vermelho/âmbar/verde conforme nível), barras de probabilidade, CTA coral "Registrar encaminhamento"

## Fase 7 — Agenda / Encaminhamentos / Alertas
Referência: tela 06 (agenda) + deck de identidade.
- Agenda como timeline vertical com dots numerados conectados por linha fina
- Toggle Lista/Mapa em segmented control
- Encaminhamentos: tabs (Todos/Pendentes/Realizados/Ausência)
- Alertas: agrupados por urgência com `border-left-4` na cor do risco

## Fase final — QA visual
- Compare cada tela com o protótipo HTML (abrir lado-a-lado)
- Teste em 390px de largura
- Rode `npm run build` — zero erros TS
- Lighthouse no mobile: contraste OK em todos os pares texto/fundo
