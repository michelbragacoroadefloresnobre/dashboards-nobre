---
name: dashboard-api
description: Documentação das rotas da API do dashboard corporativo de operações — order-summaries, daily-summaries, sellers, team-of-today, forms e top-sales. Inclui eventos Pusher para atualizações em tempo real. Use ao implementar telas do dashboard que consomem essas rotas.
user-invocable: true
---

# API do Dashboard de Operações

Base URL: `/api/v1/dashboard/operation`

Todas as rotas são públicas (`public: true`). As respostas seguem o formato `{ data: ... }`.

---

## 1. GET `/api/v1/dashboard/operation/order-summaries`

Resumos individuais de cada pedido. Cada pedido gera um `OrderSummary` com valores desnormalizados.

### Query Params

| Param   | Tipo   | Obrigatório | Descrição                                                                       |
| ------- | ------ | ----------- | ------------------------------------------------------------------------------- |
| `start` | string | Não         | Data/hora início do filtro (`createdAt >= start`). Formato ISO ou `YYYY-MM-DD`. |
| `end`   | string | Não         | Data/hora fim do filtro (`createdAt <= end`).                                   |

### Resposta

```json
{
  "data": [
      {
        "id": "uuid",
        "amount": "150.00",
        "cost": "80.00" | null,
        "orderId": "uuid",
        "team": "tulum" | "dubai" | "none",
        "status": "PRODUCING" | "FINISHED" | "CANCELLED",
        "createdAt": "2026-03-16T12:00:00.000Z",
        "product": {
          "id": "uuid",
          "name": "Nome do Produto",
          "imageUrl": "https://..."
        } | undefined,
        "seller": {
          "id": "uuid",
          "name": "Nome do Vendedor",
          "email": "email@exemplo.com",
          "team": "tulum" | "dubai" | "none",
          "shift": "MORNING" | "NIGHT",
          "imageUrl": "https://..." | null,
          "permission": "comercial" | "supervisor",
          "createdAt": "2026-01-01T00:00:00.000Z"
        } | undefined
      }
    ]
}
```

### Tipos relevantes

- `status`: `"PRODUCING"` (em produção/aguardando), `"FINISHED"` (finalizado), `"CANCELLED"` (cancelado)
- `team`: `"tulum"`, `"dubai"` ou `"none"`
- `product` e `seller` podem ser `undefined` (ex: pedidos WooCommerce sem vendedor atribuído)
- `amount` e `cost` são strings decimais (DECIMAL do banco)

---

## 2. GET `/api/v1/dashboard/operation/daily-summaries`

Resumos agregados por dia. Cada registro representa a operação de um dia inteiro (faturamento, custo, total de pedidos, time do turno).

### Query Params

| Param   | Tipo   | Obrigatório | Descrição                                                      |
| ------- | ------ | ----------- | -------------------------------------------------------------- |
| `start` | string | Não         | Data início do filtro (`date >= start`). Formato `YYYY-MM-DD`. |
| `end`   | string | Não         | Data fim do filtro (`date <= end`).                            |

### Resposta

```json
{
  "data": [
      {
        "date": "2026-03-16",
        "invoice": "5000.00",
        "cost": "2500.00",
        "orderTotal": 25,
        "team": "tulum" | "dubai" | "none",
        "passthroughRate": "0.50" | null
      }
    ]
}
```

### Notas

- `date` é `DATEONLY` (formato `YYYY-MM-DD`), e é a chave primária
- `invoice` = soma dos `amount` dos OrderSummary não-cancelados do dia
- `cost` = soma dos `cost` dos OrderSummary não-cancelados do dia
- `orderTotal` = contagem de OrderSummary não-cancelados do dia
- `team` = time do primeiro pedido criado após 9h naquele dia
- `passthroughRate` = taxa de repasse: `soma dos costs (onde cost != null) / soma dos amounts (onde cost != null)`. Valor entre 0 e 1 (ex: `"0.4500"` = 45%). `null` quando nenhum pedido do dia tem custo definido

---

## 3. GET `/api/v1/dashboard/operation/team-of-today`

Retorna qual time está operando no momento. A lógica usa contagem de vendedores ativos no Redis (últimos 30 minutos) para determinar o time do turno.

### Query Params

Nenhum.

### Resposta

```json
{
  "data": {
    "team": "tulum" | "dubai" | "none"
  }
}
```

### Lógica

- Compara vendedores ativos (`ativos:tulum` vs `ativos:dubai` no Redis)
- Retorna o time com mais vendedores ativos
- Em caso de empate ou nenhum ativo, fallback para lógica interna do serviço

---

## 4. GET `/api/v1/dashboard/operation/forms`

Lista todos os formulários (OrderRequest) no período, com o vendedor associado.

### Query Params

| Param   | Tipo   | Obrigatório | Descrição                                                                       |
| ------- | ------ | ----------- | ------------------------------------------------------------------------------- |
| `start` | string | Não         | Data/hora início do filtro (`CreatedAt >= start`). Formato ISO ou `YYYY-MM-DD`. |
| `end`   | string | Não         | Data/hora fim do filtro (`CreatedAt <= end`).                                   |

### Resposta

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "NOT_CONVERTED" | "CANCELLED" | "CONVERTED",
      "team": "tulum" | "dubai" | "none" | null,
      "seller": {
        "id": "uuid",
        "name": "Nome do Vendedor",
        "email": "email@exemplo.com",
        "team": "tulum" | "dubai" | "none",
        "shift": "MORNING" | "NIGHT",
        "imageUrl": "https://..." | null,
        "permission": "comercial" | "supervisor",
        "createdAt": "2026-01-01T00:00:00.000Z"
      } | undefined
    }
  ]
}
```

### Notas

- `seller` pode ser `undefined` quando o formulário não tem `sellerHelenaId` ou o vendedor não foi encontrado
- O objeto `seller` segue o mesmo formato padronizado das outras rotas do dashboard (`order-summaries`, `sellers`)
- Ordenado por `CreatedAt` decrescente

---

## 5. GET `/api/v1/dashboard/operation/top-sales`

Retorna as **6 maiores vendas do mês atual com valor acima de R$1.500**, ordenadas por valor decrescente. O mês é calculado no fuso `America/Sao_Paulo` (dia 1 do mês corrente até agora).

### Query Params

Nenhum. O período é sempre o mês corrente.

### Resposta

```json
{
  "data": [
    {
      "id": "uuid",
      "amount": "850.00",
      "cost": "400.00" | null,
      "orderId": "uuid",
      "team": "tulum" | "dubai" | "none",
      "status": "PRODUCING" | "FINISHED",
      "createdAt": "2026-03-16T12:00:00.000Z",
      "product": {
        "id": "uuid",
        "name": "Nome do Produto",
        "imageUrl": "https://..."
      } | undefined,
      "seller": {
        "id": "uuid",
        "name": "Nome do Vendedor",
        "email": "email@exemplo.com",
        "team": "tulum" | "dubai" | "none",
        "shift": "MORNING" | "NIGHT",
        "imageUrl": "https://..." | null,
        "permission": "comercial" | "supervisor",
        "createdAt": "2026-01-01T00:00:00.000Z"
      } | undefined
    }
  ]
}
```

### Notas

- Retorna no máximo 6 registros
- Pedidos com `status = "CANCELLED"` são excluídos
- O formato dos objetos `product` e `seller` é idêntico ao da rota `order-summaries`

---

## Eventos Pusher (tempo real)

O backend dispara eventos no canal `dashboard-channel`. O dashboard deve se inscrever nesse canal para receber atualizações em tempo real.

### Configuração do client Pusher

```typescript
import Pusher from "pusher-js";

const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  forceTLS: true,
  enabledTransports: ["ws", "wss"],
});
```

### Eventos disponíveis

| Evento                  | Valor                     | Quando é disparado                                                 | Payload                                            |
| ----------------------- | ------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| `DASHBOARD_UPDATE`      | `"dashboard-update"`      | Sempre que um pedido é criado                                      | `{ timestamp: string }`                            |
| `PREMIUM_ORDER_CREATED` | `"premium-order-created"` | Quando um pedido premium (top 12 produtos mais caros) é criado     | Dados do pedido premium                            |
| `TOP_SALE_CREATED`      | `"top-sale-created"`      | Quando um novo pedido entra no ranking das 6 maiores vendas do mês | Objeto summary (mesmo formato da rota `top-sales`) |

### Evento `top-sale-created` — como implementar no dashboard

Disparado quando um pedido recém-criado está entre as 6 maiores vendas do mês. O payload contém **um único** summary no mesmo formato da rota `top-sales`.

Fluxo recomendado:

1. **Carregar ranking inicial** — `GET /api/v1/dashboard/operation/top-sales` no mount do componente
2. **Ouvir evento Pusher** — Se inscrever no canal `dashboard-channel`, evento `top-sale-created`
3. **Atualizar ranking** — Ao receber o evento, re-fazer o fetch da rota para obter o ranking completo atualizado

```typescript
useEffect(() => {
  const channel = pusherClient.subscribe("dashboard-channel");

  channel.bind("top-sale-created", () => {
    // Re-fetch para obter o ranking atualizado
    fetchTopSales();
  });

  return () => {
    channel.unbind("top-sale-created");
    pusherClient.unsubscribe("dashboard-channel");
  };
}, []);
```

---

## Enums de referência

```typescript
enum OrderSummaryStatus {
  PRODUCING = "PRODUCING",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

enum PedidoTime {
  TULUM = "tulum",
  DUBAI = "dubai",
  NONE = "none",
}

enum OrderRequestStatus {
  NOT_CONVERTED = "NOT_CONVERTED",
  CANCELLED = "CANCELLED",
  CONVERTED = "CONVERTED",
}
```
