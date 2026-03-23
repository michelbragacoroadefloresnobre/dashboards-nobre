# CLAUDE.md — Dashboards FloraHub

## Sobre o Projeto

Dashboards para uma floricultura, exibidos em TVs no ambiente de trabalho. O dashboard principal (Vendas) permite vendedores acompanharem desempenho individual e de equipe. Suporta múltiplos dashboards via sidebar e modo tela cheia para TV.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Linguagem:** TypeScript (strict)
- **Estilização:** Tailwind CSS v4 (via `@tailwindcss/postcss`)
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
- Código em inglês, conteúdo da página em português
- Não usar CSS inline ou styled-components — apenas classes Tailwind com tokens do `@theme`
- Body tem `overflow: hidden` e `h-screen` — nunca adicionar scroll
- Resolução de referência: 1920x1080 (Full HD)

## Estrutura

- Rotas: `src/app/(dashboard)/[nome]/page.tsx`
- Componentes do dashboard: `src/app/(dashboard)/[nome]/_components/`
- Hooks e componentes compartilhados: `src/app/(dashboard)/_hooks/` e `src/app/(dashboard)/_components/`
- Sidebar: `src/app/(dashboard)/_components/sidebar.tsx`
- O route group `(dashboard)` aplica layout com sidebar + fullscreen automaticamente
