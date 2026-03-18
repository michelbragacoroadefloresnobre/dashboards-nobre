---
name: dashboard-api
description: Documentação das rotas da API do dashboard corporativo de operações — order-summaries, daily-summaries, sellers, team-of-today e conversion-tax. Use ao implementar telas do dashboard que consomem essas rotas.
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
        "cost": "80.00",
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
        "team": "tulum" | "dubai" | "none"
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

## 4. GET `/api/v1/dashboard/operation/conversion-tax`

Taxa de conversão dos pedidos (OrderRequest). Calcula a proporção de requests com status `CONVERTED` em relação ao total no período.

### Query Params

| Param   | Tipo               | Obrigatório | Descrição                                                                       |
| ------- | ------------------ | ----------- | ------------------------------------------------------------------------------- |
| `start` | string             | Não         | Data/hora início do filtro (`CreatedAt >= start`). Formato ISO ou `YYYY-MM-DD`. |
| `end`   | string             | Não         | Data/hora fim do filtro (`CreatedAt <= end`).                                   |
| `team`  | "tulum" \| "dubai" | Não         | Time que você quer a taxa de conversão.                                         |

### Resposta

```json
{
  "data": {
    "conversionTax": 0.75
  }
}
```

### Notas

- `conversionTax` é um número entre 0 e 1 (ex: 0.75 = 75% de conversão)
- Calculado como: quantidade de requests com status `CONVERTED` / total de requests no período
- Retorna 0 se não houver requests no período

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
