---
name: dashboard-api
description: Documentação das rotas públicas da API de dashboards (/api/v1/dashboard) — operação (order-summaries, daily-summaries, sellers, team-of-today, forms e top-sales) e custos da Julia (julia/model-usage). Inclui eventos Pusher para atualizações em tempo real. Use ao implementar telas do dashboard (FloraHub) que consomem essas rotas.
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
        "team": "SIENA" | "YORK" | "NONE",
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
          "team": "SIENA" | "YORK" | "NONE",
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
- `team`: `"SIENA"`, `"YORK"` ou `"NONE"`
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
        "team": "SIENA" | "YORK" | "NONE",
        "passthroughRate": "0.5000" | null
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
    "team": "SIENA" | "YORK" | "NONE"
  }
}
```

### Lógica

- Compara vendedores ativos (`ativos:SIENA` vs `ativos:YORK` no Redis)
- Retorna o time com mais vendedores ativos
- Em caso de empate ou nenhum ativo, fallback para lógica interna do serviço

---

## 4. GET `/api/v1/dashboard/operation/forms`

Lista todos os formulários (Form) no período, com o vendedor associado.

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
      "team": "SIENA" | "YORK" | "NONE" | null,
      "seller": {
        "id": "uuid",
        "name": "Nome do Vendedor",
        "email": "email@exemplo.com",
        "team": "SIENA" | "YORK" | "NONE",
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

Retorna as **6 maiores vendas do mês com valor acima de R$1.500**, ordenadas por valor decrescente. O mês é calculado no fuso `America/Sao_Paulo`.

### Query Params

| Param  | Tipo   | Obrigatório | Descrição                                                                                                                                  |
| ------ | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `date` | string | Não         | Data de referência no formato `YYYY-MM-DD`. Busca do dia 1 do mês dessa data até o final desse dia. Quando omitido, usa a data de hoje. |

### Resposta

```json
{
  "data": [
    {
      "id": "uuid",
      "amount": "850.00",
      "cost": "400.00" | null,
      "orderId": "uuid",
      "team": "SIENA" | "YORK" | "NONE",
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
        "team": "SIENA" | "YORK" | "NONE",
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
  SIENA = "SIENA",
  YORK = "YORK",
  NONE = "NONE",
}

enum FormStatus {
  NOT_CONVERTED = "NOT_CONVERTED",
  CANCELLED = "CANCELLED",
  CONVERTED = "CONVERTED",
}
```

---

# API de Custos da Julia

Base URL: `/api/v1/dashboard/julia`

Rota pública (`public: true`), resposta no formato `{ data: ... }`, CORS liberado para qualquer origem como todo `/api/*`. Agrega a tabela `nobre_julia_model_usage`, onde cada linha é uma tentativa HTTP de chamada de modelo da Julia ou de um sub-agente. Como o registro nasce e o que cada medida significa: [uso-e-custo.md](../julia-agent/references/uso-e-custo.md) da skill `julia-agent`.

## 6. GET `/api/v1/dashboard/julia/model-usage`

Consumo de modelo no período: totais, por agente, série temporal, por agente × tarefa × modelo e erros por tipo.

### Query Params

| Param    | Tipo              | Obrigatório | Descrição                                                                                                                                  |
| -------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `start`  | string            | Sim         | Início do período (inclusivo). ISO 8601 com fuso, ex.: `2026-09-01T03:00:00.000Z`.                                                         |
| `end`    | string            | Sim         | Fim do período (exclusivo). Precisa ser maior que `start` e no máximo 92 dias depois.                                                      |
| `agents` | string            | Não         | Ids de agente separados por vírgula (`julia_turn,julia_media`). Omitido = todos. Id desconhecido responde 400.                             |
| `bucket` | `"hour"` \| `"day"` | Não       | Granularidade da série. Padrão: `hour` até 3 dias de período, `day` acima. `hour` explícito vale até 14 dias; acima disso vira `day`.      |

Erro de validação responde `400` com `{ "error": "...", "status": 400 }`.

### Resposta

```json
{
  "data": {
    "range": {
      "start": "2026-09-01T03:00:00.000Z",
      "end": "2026-09-08T03:00:00.000Z",
      "bucket": "hour" | "day",
      "timezone": "America/Sao_Paulo",
      "buckets": ["2026-09-01T00:00", "2026-09-02T00:00"]
    },
    "firstRecordedAt": "2026-09-04T18:21:07.512Z" | null,
    "totals": { ...UsageMeasures, ...UsageLatency },
    "byAgent": [
      { "agent": "julia_turn", ...UsageMeasures, ...UsageLatency }
    ],
    "series": [
      { "bucket": "2026-09-01T00:00", "agent": "julia_turn", ...UsageMeasures }
    ],
    "byModel": [
      {
        "agent": "julia_turn",
        "task": "active" | null,
        "model": "google/gemini-3.8-flash",
        "providers": "vertex" | "google, vertex" | null,
        ...UsageMeasures,
        ...UsageLatency
      }
    ],
    "errors": [
      {
        "agent": "julia_turn",
        "errorKind": "rate_limit",
        "errorStatusCode": 429 | null,
        "count": 3,
        "lastAt": "2026-09-04T18:21:07.512Z",
        "lastMessage": "Resource exhausted" | null
      }
    ]
  }
}
```

### `UsageMeasures`

| Campo               | Tipo   | Descrição                                                                                                                         |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `requests`          | number | Tentativas HTTP ao AI Gateway. Cada step de tool-call e cada retry do SDK conta uma — mesma contagem do dashboard do gateway.     |
| `errors`            | number | Tentativas que terminaram em erro.                                                                                                |
| `executions`        | number | Chamadas distintas de `generateText`/`generateObject`; uma execução pode ter várias tentativas.                                   |
| `failedExecutions`  | number | Execuções cuja última tentativa falhou.                                                                                           |
| `costUsd`           | number | Custo cobrado pelo gateway, em USD. Hoje o Gemini é cobrado a US$ 0 nesta conta, então fica zerado.                               |
| `marketCostUsd`     | number | Preço de tabela do modelo, em USD — o número que reflete consumo enquanto `costUsd` for zero.                                     |
| `inputTokens`       | number | Tokens de entrada, **cache incluso**.                                                                                             |
| `cachedInputTokens` | number | Parte da entrada lida do cache de prompt.                                                                                         |
| `cacheWriteTokens`  | number | Parte da entrada gravada no cache (só provedores que reportam gravação, como Anthropic; Gemini reporta só leitura).               |
| `outputTokens`      | number | Tokens de saída, raciocínio incluso.                                                                                              |
| `reasoningTokens`   | number | Parte da saída gasta em raciocínio.                                                                                               |

### `UsageLatency`

`p50DurationMs` e `p95DurationMs` (`number | null`): percentis da duração das tentativas **com sucesso**, em milissegundos. `null` quando não há sucesso no grupo.

### Notas

- Métricas derivadas, calculadas no dashboard: taxa de erro = `errors / requests`; entrada sem cache = `inputTokens − cachedInputTokens − cacheWriteTokens`; taxa de cache = `cachedInputTokens / inputTokens`.
- `range.buckets` traz **todas** as chaves do período, inclusive as vazias, no fuso `America/Sao_Paulo` e no formato `YYYY-MM-DDTHH:mm` sem offset. `series` traz só bucket × agente com dados: para desenhar as linhas, preencher o resto com `0` (e `null` em taxas).
- `byAgent` e `series` só listam agentes com registro no período; `byAgent` vem na ordem canônica (`julia_turn`, `julia_followup`, `julia_local`, `julia_media`).
- `byModel` agrupa por agente × tarefa × modelo, ordenado por agente e depois por `requests` decrescente; `providers` é a lista dos provedores finais escolhidos pelo gateway no período.
- `errors` agrupa por agente × `errorKind` × `errorStatusCode`, ordenado por `count` decrescente, no máximo 50 linhas; `lastMessage` é a mensagem da ocorrência mais recente, truncada em 500 caracteres.
- `firstRecordedAt` é a primeira linha da tabela inteira, não do período — serve para avisar que não existe dado anterior ao deploy do registro.
- Sem cache HTTP (`revalidate = 0`); o dashboard atual refaz a consulta a cada 60 s nos presets.

### Enums e rótulos (pt-BR)

| `agent`          | Rótulo           | O que é                                                          | Cor (claro / escuro)  |
| ---------------- | ---------------- | ---------------------------------------------------------------- | --------------------- |
| `julia_turn`     | Julia (turno)    | Turno de atendimento no WhatsApp, nos modos `active` e `post_sale` | `#9c7c0b` / `#af8f15` |
| `julia_followup` | Follow-up        | Decisão de re-engajamento depois do silêncio do cliente          | `#2171cc` / `#4087de` |
| `julia_local`    | Agente de local  | Resolução do local do velório com grounding no Google Maps       | `#d35f00` / `#da6c1e` |
| `julia_media`    | Análise de mídia | Transcrição de áudio e leitura de imagem e PDF                   | `#8254c4` / `#956ed2` |

As cores são fixas por identidade do agente (nunca por ranking) e foram validadas para daltonismo nos dois temas — usar as mesmas no FloraHub.

| `task`      | Rótulo            |
| ----------- | ----------------- |
| `active`    | Venda             |
| `post_sale` | Pós-venda         |
| `decision`  | Decisão           |
| `grounding` | Grounding no Maps |
| `audio`     | Áudio             |
| `image`     | Imagem            |
| `document`  | PDF               |
| `null`      | Sem tarefa        |

| `errorKind`      | Rótulo                      |
| ---------------- | --------------------------- |
| `timeout`        | Timeout                     |
| `rate_limit`     | Limite de requisições (429) |
| `auth`           | Autenticação                |
| `bad_request`    | Requisição inválida (4xx)   |
| `provider_error` | Erro do provedor (5xx)      |
| `network`        | Rede                        |
| `unknown`        | Desconhecido                |

Fonte no código: `src/lib/julia/model-usage/agents.ts`, `classify-error.ts` e `report-types.ts` (tipos TypeScript da resposta, prontos para copiar).
