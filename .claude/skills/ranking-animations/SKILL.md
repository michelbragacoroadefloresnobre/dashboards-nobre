---
name: ranking-animations
description: Como implementar animação FLIP de reordenação e celebração dourada de top 1 nos rankings do dashboard de vendas. Use ao adicionar animações em componentes de ranking.
user-invocable: true
---

# Animações de Ranking

Dois sistemas de animação para listas de ranking: **FLIP** (reordenação suave) e **Celebração Top 1** (efeito dourado + shimmer + som).

## 1. FLIP — Reordenação suave

Hook: `src/app/(dashboard)/_hooks/use-flip.ts`

### Uso

```tsx
import { useFlip } from "@/app/(dashboard)/_hooks/use-flip";

function RankingPage({ children }: { children: ReactNode }) {
  const flipRef = useFlip();
  return <div ref={flipRef} className="flex flex-col gap-0.5">{children}</div>;
}

// Cada item DEVE ter data-flip-key com a IDENTIDADE do item (nome), NÃO a posição:
<div key={v.name} data-flip-key={v.name} className="...">
```

Componente compartilhado já extraído: `src/app/(dashboard)/vendas/_components/ranking-page.tsx`

### Como funciona

- `useLayoutEffect` sem deps roda após cada commit do React
- Compara `getBoundingClientRect()` atual com o armazenado do render anterior
- Se houve delta Y, aplica `translateY` inverso via `element.animate()` e anima até 0
- Duração: 800ms, easing: `cubic-bezier(0.22, 0.61, 0.36, 1)`

### Armadilhas críticas

1. **Key deve ser identidade, não posição.** `key={v.pos}` faz o React achar que o item não mudou. Usar `key={v.name}` (ou ID único).

2. **Animações em progresso são protegidas.** Se uma FLIP está `"running"`, o elemento é PULADO no próximo `useLayoutEffect`. Isso evita que re-renders intermediários (ex: setState de celebração) matem a animação. Só após `onfinish` o elemento volta a ser medido.

3. **Só finaliza animações FLIP, nunca `getAnimations().finish()` genérico.** Isso mataria animações CSS externas (shimmer, etc.) que coexistem nos mesmos elementos.

## 2. Celebração Top 1 — Efeito dourado

Função: `src/app/(dashboard)/vendas/_lib/celebrate-top1.ts`

### Uso

```tsx
import { celebrateTop1 } from "../_lib/celebrate-top1";

const [prevTop, setPrevTop] = useState<string | null>(null);
const currentTop = data[0]?.name ?? null;

useEffect(() => {
  if (prevTop === null && currentTop !== null) {
    queueMicrotask(() => setPrevTop(currentTop));
  } else if (prevTop !== null && currentTop !== null && currentTop !== prevTop) {
    const audio = new Audio("/ka-ching.mp3");
    audio.play().catch(() => {});
    celebrateTop1(currentTop);
    queueMicrotask(() => setPrevTop(currentTop));
  }
}, [currentTop, prevTop]);
```

### Como funciona

1. Localiza o elemento via `document.querySelector('[data-flip-key="nome"]')`
2. `element.animate()` com `backgroundColor` (branco → dourado → branco) e `boxShadow` (glow)
3. Cria um `<div>` temporário via DOM para shimmer sweep (gradient deslizando), remove no `onfinish`
4. Duração total: 2500ms. O dourado segura até ~45% (~1125ms), cobrindo a FLIP (800ms)

### Armadilha crítica — NÃO usar CSS classes nem estado React

Tentativas com CSS classes (`animate-top1-shimmer`, `top1-overlay`) falharam porque:

- **CSS `@keyframes` com `background: linear-gradient(...)` não interpola** — os valores simplesmente pulam entre keyframes
- **`background-color` via `@keyframes` conflita com Tailwind v4 layers** — a utilidade `bg-white` tem prioridade sobre a animação
- **Estado React (`celebratingTop`) causa re-renders** que disparam o `useLayoutEffect` do FLIP, matando a animação em progresso via `.finish()`
- **Overlay div condicional** interfere com a reconciliação do React (muda índice dos filhos no grid)

A solução que funciona: **Web Animations API (`element.animate()`) direto no DOM**, igual ao FLIP. Sem classes, sem estado, sem re-renders.

## Referência: monthly-ranking.tsx

Implementação completa em `src/app/(dashboard)/vendas/_components/monthly-ranking.tsx`. Use como referência para replicar no `daily-ranking.tsx`.

Estrutura:
```
MonthlyRanking
├── useEffect (detecção de top 1 + celebrateTop1 + som)
├── Carousel
│   └── RankingPage (useFlip)
│       └── div[data-flip-key={v.name}] (cada row)
```
