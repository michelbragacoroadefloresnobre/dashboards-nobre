# CLAUDE.md — Dashboard de Vendedores (FloraHub)

## Sobre o Projeto

Este é um projeto focado em dashboards para uma floricultura. O dashboard principal (Vendas) é exibido em TVs no ambiente de trabalho para que vendedores acompanhem desempenho individual e de equipe. A aplicação suporta múltiplos dashboards via sidebar de navegação e possui modo tela cheia dedicado para exibição em TV.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Linguagem:** TypeScript (strict)
- **Estilização:** Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Fontes:** DM Sans (body) + Playfair Display (display) via Google Fonts CDN
- **React:** v19

## Comandos

```bash
npm install      # Instalar dependências
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servir build de produção
```

## Convenções

- Arquivos e pastas: `kebab-case` em inglês
- Rotas (URLs): em português — ex: `/vendas`, `/financeiro`
- Rotas ficam em `src/app/(dashboard)/[nome]/page.tsx`
- Código em inglês
- Conteudo da pagina em portugues

### Roteamento

- O route group `(dashboard)` aplica o layout com sidebar + fullscreen a todas as rotas sem afetar a URL.
- `/` redireciona para `/vendas` via `redirect()` do Next.js.
- A Sidebar usa `next/link` + `usePathname()` para navegação e destaque da rota ativa.
- Cada dashboard futuro é uma nova pasta em `src/app/(dashboard)/[nome]/page.tsx`.

### Modo TV (Tela Cheia)

- O `useFullscreen` hook usa a Fullscreen API nativa do browser (`requestFullscreen` / `exitFullscreen`).
- Quando fullscreen está ativo, a Sidebar é removida da DOM e o dashboard ocupa 100% da viewport.
- O HeaderBanner com recordes **sempre** aparece (faz parte do dashboard, não da sidebar).
- Botão flutuante no canto inferior direito com tooltip, sempre visível.

### Sistema de Carousel

- **Intervalo:** 12 segundos entre páginas.
- **Transição:** Slide horizontal + fade combinado (500ms). A página atual sai com `translateX(-40px) + opacity 0`, a nova entra com `translateX(40px) → 0 + opacity 1`.
- **Paginação:** Dots discretos no bottom do card. Escondidos quando há apenas 1 página.
- Usado em: tabela mensal, tabela diária e conquistas.

### Cálculo Dinâmico de Linhas

- O `useDynamicPerPage` hook mede a `clientHeight` do container via ref no mount.
- Divide pela altura estimada de uma linha (54px mensal, 50px diária).
- Cada tabela calcula independentemente — a mensal pode mostrar mais linhas que a diária.
- Mínimo garantido: 3 linhas. O conteúdo fica oculto até a medição completar (1 frame).
- Otimizado para TV onde a resolução é fixa (sem recálculo em resize).

### Dados

- Atualmente estáticos em `src/data/dashboard.ts` com interfaces TypeScript.
- **Interfaces:** `MonthlySeller`, `DailySeller`, `Conquista`.
- Para integrar com API real: substituir os arrays em `dashboard.ts` por chamadas fetch/SWR/React Query.
- `AVATAR_COLORS` é um array de gradientes atribuídos ciclicamente pela posição do vendedor.

## Design System

### Paleta de Cores (definida em `globals.css` via `@theme`)

| Token                | Hex       | Uso                             |
| -------------------- | --------- | ------------------------------- |
| `bg`                 | `#F6F4F0` | Fundo geral                     |
| `bg-card`            | `#FFFFFF` | Cards                           |
| `bg-card-alt`        | `#FAFAF8` | Cards internos / KPIs           |
| `text-primary`       | `#1A1A1A` | Texto principal                 |
| `text-secondary`     | `#6B6B6B` | Texto secundário                |
| `text-muted`         | `#9A9A9A` | Labels, headers de tabela       |
| `accent-green`       | `#2D6A4F` | Accent principal, items ativos  |
| `accent-green-light` | `#D8F3DC` | Badges, KPI positivo            |
| `accent-gold`        | `#C8963E` | 1º lugar, conquistas, destaques |
| `accent-gold-light`  | `#FFF3D6` | Badge "Hoje"                    |
| `accent-red`         | `#C0392B` | KPI negativo                    |
| `accent-red-light`   | `#FDECEA` | Background KPI negativo         |
| `border`             | `#E8E6E1` | Bordas de cards                 |
| `border-light`       | `#F0EEEA` | Bordas internas                 |

### Tipografia

- **Body:** DM Sans (300–700) — usado em todo o app via classe `font-body`.
- **Display:** Playfair Display (600, 700) — usado em títulos e valores de destaque via classe `font-display`.

### Animações (definidas em `globals.css`)

- `animate-slide-down` — Header banner entrada (translateY -20px → 0)
- `animate-fade-up-1/2/3` — Colunas com delay escalonado (0.1s, 0.2s, 0.3s)
- `animate-bar-grow` — Barras da corrida de vendas (width 0 → final)
- `animate-shimmer` — Brilho no troféu de recordes (brightness 1 → 1.3)
- `animate-pulse-dot` — Indicador "ao vivo" pulsante

### Sidebar

- Fundo branco (`bg-white`), borda direita, largura fixa 256px.
- Logo "FloraHub" no topo com ícone gradiente verde.
- Items usam `rounded-xl`, item ativo tem `bg-accent-green/8%` + dot indicator.
- Footer com avatar de iniciais do admin.

## Regras para Contribuição

### Ao criar novos dashboards:

1. Criar pasta `src/app/(dashboard)/[nome]/page.tsx`.
2. Criar componentes específicos em `src/app/(dashboard)/[nome]/_components/` (kebab-case).
3. Hooks e componentes compartilhados ficam em `src/app/(dashboard)/_hooks/` e `src/app/(dashboard)/_components/`.
4. O layout com sidebar já é herdado automaticamente do route group.
5. Adicionar o item na lista `dashboards` em `src/app/(dashboard)/_components/sidebar.tsx`.

### Ao adicionar dados/métricas:

1. Definir interface em `src/data/dashboard.ts`.
2. Dados mock ficam no mesmo arquivo.
3. Componentes importam de `@/data/dashboard`.

### Estilo:

- Usar classes Tailwind referenciando os tokens do `@theme` (ex: `bg-accent-green`, `text-text-muted`).
- Não usar CSS inline ou styled-components.
- Cards seguem padrão: `bg-bg-card rounded-2xl border border-border shadow-sm`.
- Labels de tabela: `text-[10px] uppercase tracking-widest text-text-muted font-semibold`.

### TV-specific:

- Body tem `overflow: hidden` e `h-screen` — nunca adicionar scroll.
- Todo conteúdo que exceda o espaço disponível deve usar o sistema de carousel.
- Testar em 1920x1080 (Full HD) como resolução de referência.
