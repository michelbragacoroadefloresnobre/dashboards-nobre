Muito bem. Vamos usar a abordagem de processamento atualizado então.

Use a skill dashboard-api para ter acesso a api. A url da api esta na variavel de ambiente SISTEMA_CFN_URL. (ex: process.env.SISTEMA_CFN_URL/api/v1/dashboard/operation/daily-summaries)

Quero que você comece fazendo o backend, nada de frontend por enquanto. Você vai agir estritamente como um programador backend, sem tocar no codigo front end da aplicação.

Crie uma rota /api/operation. Essa é a rota que processa todos os dados, formata e envia pro useQuery consulmir e passar para os componentes. Vou te passar o que é nessario para cada componente:

Use DateTime do luxon para gerar os ISOs com timezone America/Sao_Paulo. Sempre considere este timezone

HeaderBanner com records:
Maior faturamento e maior numero de pedidos:

- Use o /daily-summary para buscar o maior invoice (faturamento) e o maior orderTotal cada item haverá a data e o time que estava atuando no dia que será populada no front end tambem.
- Exiba a data atual no lugar onde está 10/03/2028
- Exiba o time que está atuando hoje com /team-of-today

MonthlyRank:

- Busque todos os pedidos pelo /order-summaries desde o inicio desse mês até o momento e extraia todos os vendedores
- Calcule o faturamento de cada vendedor pelo atributo "amount", a quantidade de pedidos e o ticket calculando a soma dos amount / quantidade de pedidos
- Ordene pelo maior faturamente, em caso de empate ordene pelo ticket, e se der empate novamente, ordene pelo numero de pedidos

DailyRanking:
Mesma logica do MonthlyRanking, mas ao invés de pegar todos summaries desde o inicio do mês, pegue todos summaries desde meia noite do dia de hoje

OperationKPIs:
Mostram os KPIs diarios do time que está atuando.

- Faturamento (/order-summaries): Soma de todos "amount" desde meia noite do dia de hoje. Filtre o campo team === time de hoje (/team-of-today)
- Taxa de Conversão (/conversion-tax): Só fazer a busca na API /conversion-tax especificando o time de hoje
- Repasse (/order-summaries): Divida a soma de todos "cost" pelo "amount" de todos summaries para obter a porcentagem de repasse

SalesRace:

- Busque todos os /daily-summaries dos ultimos 7 dias até agora.
- Calcule o lucro médio de cada time "tulum" e "dubai" calculando a soma de todos "invoice", até ontem e dividindo pela soma de todos "cost" até o dia de ontem.
- Use o campo "date" tambem para calcular o lucro de hoje subtraindo o cost de invoice

WeeklyRevenueChart:
Use o /daily-summaries para buscar o "invoice" (faturamento) dos ultimos 7 dias

- Busque o faturamento de cada dia do time tulum e o faturamento de cada dia do time dubai
- Todo dia 1 dos times trabalham, então terá dia que será do time dubai e dia que será do time tulum. Use o "team" para saber qual time trabalhou naquele dia e "date" pra saber qual a data que esse time trabalhou.
- O grafico precisa saber a data, o time e o faturamento para conseguir ser exibido corretamente.

Conquests:

- Busque todos os /order-summaries desde o inicio do mês, então organize as 9 maiores vendas.
- Retorne o produto juntamente com a foto, o vendedor e o valor da venda

Esses são todos os dados que cada componente precisa para funciona. Lembrando que você não deve fazer nenhuma alteração no front-end, apenas construa a rota necessaria para funcionar.

Ao entender os graficos, as informações que eles precisam e criar rota para processar e formatar os dados para que front end consuma, você deverá criar uma skill para que outra IA consiga implementar essas informações no front end. Me confirme o que entendeu para começarmos.
