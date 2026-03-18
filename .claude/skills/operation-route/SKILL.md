---
name: operation-route
description: Documentação da rota interna GET /api/operation que retorna todos os dados processados do dashboard de vendas. Use ao integrar os componentes frontend com dados reais via React Query.
user-invocable: true
---

# Rota GET `/api/operation`

Rota interna Next.js que busca dados da API externa, processa e retorna um payload único para o dashboard de vendas.

**Arquivo:** `src/app/api/operation/route.ts`
**Tipos:** `src/app/api/operation/types.ts`

## Resposta

```json
{ "data": { ...OperationResponse } }
```

Headers: `Cache-Control: no-store, max-age=0`

---

## Estrutura do payload (`OperationResponse`)

### 1. `headerBanner`

Recordes históricos + informações do dia.

```ts
{
  highestRevenue: { value: string; date: string; team: string }  // "R$ 80.699,33", "27/02/2026", "dubai"
  highestOrders: { value: number; date: string; team: string }   // 174, "27/02/2026", "dubai"
  today: { date: string; team: string }                          // "17/03/2026", "tulum"
}
```

**Componente alvo:** `HeaderBanner`
- `highestRevenue` → recorde de faturamento (maior invoice de todos os daily-summaries)
- `highestOrders` → recorde de pedidos (maior orderTotal de todos os daily-summaries)
- `today.date` → data atual formatada DD/MM/YYYY
- `today.team` → time operando hoje

---

### 2. `monthlyRanking`

Ranking mensal de vendedores, já ordenado por faturamento.

```ts
Array<{
  pos: number       // 1, 2, 3...
  initials: string  // "EM", "SA"
  name: string      // "Erika Moreira"
  fat: string       // "R$ 22.070,00"
  orders: number    // 46
  tm: string        // "R$ 479,79"
}>
```

**Componente alvo:** `MonthlyRanking`
- Alinhado com a interface `MonthlySeller` de `src/data/dashboard.ts`
- Ordenação: fat DESC → tm DESC → orders DESC
- Vendedores sem seller na API são ignorados

---

### 3. `dailyRanking`

Ranking diário (desde meia-noite), já ordenado.

```ts
Array<{
  pos: number       // 1, 2, 3...
  initials: string  // "IB"
  name: string      // "Igor Braga"
  fat: string       // "R$ 890,00"
  orders: string    // "1 pedido" ou "2 pedidos"
}>
```

**Componente alvo:** `DailyRanking`
- Alinhado com a interface `DailySeller` de `src/data/dashboard.ts`
- Ordenação: fat DESC → orders DESC

---

### 4. `operationKpis`

KPIs do dia, filtrados pelo time de hoje.

```ts
{
  revenue: string                   // "R$ 5.230,00" — soma amount do team de hoje
  conversionTax: number             // 0.80 — taxa de conversão (0 a 1)
  repasse: number                   // 0.4224 — cost/amount (0 a 1)
  revenueChange: number | null      // 0.12 = +12% vs ontem (variação percentual)
  conversionTaxChange: number | null // 0.032 = +3.2pp vs ontem (diferença absoluta em pontos)
  repasseChange: number | null      // -0.011 = -1.1pp vs ontem (diferença absoluta em pontos)
}
```

**Componente alvo:** `OperationKPIs`
- `revenue` já formatado como moeda
- `conversionTax` e `repasse` são números brutos — formatar no frontend (ex: `(0.80 * 100).toFixed(2) + "%"`)
- Todos filtrados por `team === teamOfToday`
- **Changes vs ontem:**
  - `revenueChange`: variação percentual `(hoje - ontem) / ontem`. Ex: `0.12` = +12%. `null` se ontem não teve faturamento
  - `conversionTaxChange`: diferença absoluta em pontos (hoje - ontem). Ex: `0.032` = +3.2pp. `null` se ontem não teve dados
  - `repasseChange`: diferença absoluta em pontos (hoje - ontem). Ex: `-0.011` = -1.1pp. `null` se ontem não teve dados
  - No frontend, usar sinal positivo/negativo para determinar `up` (verde) ou `down` (vermelho)

---

### 5. `salesRace`

Corrida de vendas entre times.

```ts
{
  teams: Array<{
    name: string            // "tulum" ou "dubai"
    averageProfit: number   // lucro médio diário (invoice - cost) / dias
  }>
  todayProfit: {
    team: string    // time de hoje
    profit: number  // invoice - cost de hoje
  }
  profitDifference: number  // diferença de averageProfit entre 1º e 2º lugar
}
```

**Componente alvo:** `SalesRace`
- `teams` ordenado por averageProfit DESC
- `averageProfit` = (somaInvoice até ontem − somaCost até ontem) / dias (últimos 7 dias excluindo hoje)
- `todayProfit` filtrado pelo team de hoje
- `profitDifference` = `teams[0].averageProfit - teams[1].averageProfit` (0 se menos de 2 times)

---

### 6. `weeklyRevenueChart`

Faturamento dos últimos 7 dias, filtrado pelo time de hoje.

```ts
Array<{
  date: string     // "10/03"
  team: string     // "tulum"
  invoice: number  // 4560.00
}>
```

**Componente alvo:** `WeeklyRevenueChart`
- Ordenado por data crescente
- Apenas dias do team de hoje
- `date` formatado como DD/MM

---

### 7. `conquests`

Top 9 maiores vendas do mês.

```ts
Array<{
  name: string           // nome do produto
  price: string          // "R$ 2.100,00"
  imageUrl?: string      // URL da imagem do produto
  sellerName?: string    // nome do vendedor
}>
```

**Componente alvo:** `Conquests`
- Ordenado por valor (amount) DESC
- Máximo 9 itens
- `imageUrl` e `sellerName` podem ser undefined (pedidos sem produto/seller)

---

## Como consumir no frontend

Usar `@tanstack/react-query` com polling de 1 minuto:

```tsx
import { useQuery } from "@tanstack/react-query";
import type { OperationResponse } from "@/app/api/operation/types";

function useDashboardData() {
  return useQuery<{ data: OperationResponse }>({
    queryKey: ["operation"],
    queryFn: () => fetch("/api/operation").then((r) => r.json()),
    refetchInterval: 60_000,
  });
}
```

O `SalesDashboard` deve chamar esse hook e distribuir os dados via props para cada componente filho, substituindo as importações diretas de `@/data/dashboard`.

---

## Interfaces existentes no frontend (referência)

As interfaces em `src/data/dashboard.ts` que os componentes já usam:

- `MonthlySeller` → alinhado com `monthlyRanking`
- `DailySeller` → alinhado com `dailyRanking`
- `Conquista` → precisa adaptação (campo `emoji` e `locked`/`progress` não existem na API)
- `TeamRace` → precisa adaptação (campo `emoji` não vem da API)
- `WeeklyTeamRevenue` → alinhado com `weeklyRevenueChart`
- `AVATAR_COLORS` → continua estático, não vem da API
