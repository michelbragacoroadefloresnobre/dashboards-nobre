# Summaries — OrderSummary e DailyTeamSummary

## Visão Geral

O sistema possui duas camadas de resumo para alimentar os dashboards corporativos de operações:

| Camada               | Granularidade         | Tabela               | Chave Primária    |
| -------------------- | --------------------- | -------------------- | ----------------- |
| **OrderSummary**     | 1 registro por pedido | `order_summary`      | `id` (UUID)       |
| **DailyTeamSummary** | 1 registro por dia    | `daily_team_summary` | `date` (DATEONLY) |

---

## OrderSummary

Representa o resumo financeiro de um **pedido individual**.

### Campos

| Campo       | Tipo    | Descrição                                       |
| ----------- | ------- | ----------------------------------------------- |
| `id`        | UUID    | Identificador único                             |
| `amount`    | DECIMAL | Valor de venda do pedido                        |
| `cost`      | DECIMAL | Custo do pedido                                 |
| `sellerId`  | UUID    | Vendedor responsável                            |
| `orderId`   | UUID    | Pedido de origem (`pedido`)                     |
| `team`      | STRING  | Time que processou (`tulum`, `dubai` ou `none`) |
| `productId` | UUID    | Produto principal                               |
| `status`    | STRING  | `PRODUCING`, `FINISHED` ou `CANCELLED`          |
| `createdAt` | DATE    | Data/hora de criação                            |

### Ciclo de vida

1. **Criação** — Quando um pedido chega via webhook do WooCommerce (`ApplicationWoocommerceWebhook`), um `OrderSummary` é criado com status `PRODUCING`.
2. **Atualização** — Quando o pedido é editado (vendedor atribuído, status alterado, etc.), o `OrderSummary` é atualizado via `marketing.service.ts → updateSummaries()`. Essa atualização também pode disparar a recomputação do `DailyTeamSummary`.
3. **Cancelamento** — Pedidos cancelados recebem status `CANCELLED` e são excluídos dos cálculos de resumo diário.

### Endpoints

- `GET /api/v1/dashboard/operation/order-summaries` — Lista order summaries com filtro por período (`start`, `end`).

---

## DailyTeamSummary

Agrega os `OrderSummary` de um dia em um **resumo diário por time**.

### Campos

| Campo        | Tipo     | Descrição                                              |
| ------------ | -------- | ------------------------------------------------------ |
| `date`       | DATEONLY | Data do resumo (PK)                                    |
| `invoice`    | DECIMAL  | Faturamento total do dia                               |
| `cost`       | DECIMAL  | Custo total do dia                                     |
| `orderTotal` | INTEGER  | Quantidade de pedidos do time no dia                   |
| `team`       | STRING   | Time que trabalhou no dia (`tulum`, `dubai` ou `none`) |

### Detecção do time do dia

O time é detectado **dinamicamente** a partir dos pedidos — não há escala fixa no sistema. O código busca o primeiro pedido criado após as 9h que pertença a Tulum ou Dubai. Se nenhum for encontrado, o time fica `none`.

Isso significa que o código funciona normalmente mesmo quando um time faz plantão em dias consecutivos (ex: 3 dias seguidos).

### Lógica do turno da noite

Vendedores possuem turno (`MORNING` ou `NIGHT`). O turno da noite começa às **17h** e termina às **9h do dia seguinte**.

Pedidos criados por vendedores `NIGHT` entre **0h e 9h** pertencem ao summary do **dia anterior**, porque o vendedor ainda está no plantão da noite que começou na véspera.

**Exemplo:**

- Vendedor NIGHT cria pedido em `2026-03-19 às 02:00` → pertence ao summary de `2026-03-18`.
- Vendedor MORNING cria pedido em `2026-03-19 às 02:00` → pertence ao summary de `2026-03-19`.

### Janela de busca

Para calcular o summary do dia **D**, o sistema busca `OrderSummary` criados entre:

- `D 00:00 UTC` (início do dia)
- `D+1 09:00 UTC` (cutoff do turno da noite)

Depois aplica um filtro:

- Pedidos de vendedores NIGHT criados entre 0h-9h → incluídos apenas se pertencem a D (ou seja, dia calendário é D+1).
- Pedidos regulares → incluídos se o dia calendário é D.

### Geração

- **Cron job** — `GET /api/cron/daily-summary` roda diariamente e computa o summary do dia anterior, fazendo upsert na tabela.
- **On-demand** — A rota `GET /api/v1/dashboard/operation/daily-team-summaries` gera automaticamente summaries faltantes para hoje e ontem ao ser consultada.
- **Recomputação** — Quando um `OrderSummary` é atualizado, o `DailyTeamSummary` correspondente pode ser recomputado automaticamente.

### Endpoints

- `GET /api/v1/dashboard/operation/daily-team-summaries` — Lista resumos diários com filtro por período (`start`, `end`).

---

## Fluxo Completo

```
Webhook WooCommerce
        │
        ▼
  Cria OrderSummary (PRODUCING)
        │
        ▼
  Pedido é editado/atualizado
        │
        ▼
  Atualiza OrderSummary (amount, cost, team, seller, status)
        │
        ▼
  Recomputa DailyTeamSummary do dia correspondente
        │
        ▼
  Dashboard consome via API
```

## Scripts Utilitários

- `scripts/audit-summaries.ts` — Audita dados de summaries para encontrar inconsistências.
- `scripts/backfill-summaries.ts` — Preenche summaries retroativamente para dias que não foram computados.
