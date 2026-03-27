---
name: auth
description: Documentação do sistema de autenticação e permissões — Auth.js v5 com Credentials provider, Prisma adapter, JWT sessions, e modelo de permissões SUPER_ADMIN/ADMIN/VIEWER. Use ao implementar funcionalidades que envolvam login, sessão, proteção de rotas ou controle de acesso.
user-invocable: true
---

# Autenticação e Permissões

## Stack

- **Auth.js v5** (next-auth v5 beta) com Credentials provider
- **Prisma** como adapter para persistência de sessões/accounts
- **bcryptjs** para hash de senhas
- **JWT** como estratégia de sessão (não database sessions)

---

## Modelo de dados

### Enum `Role`

```
SUPER_ADMIN — controle total, sem restrições
ADMIN       — controle total, exceto sobre SUPER_ADMIN
VIEWER      — apenas visualização
```

### Model `User`

| Campo          | Tipo     | Notas           |
| -------------- | -------- | --------------- |
| id             | String   | cuid, PK        |
| name           | String?  | opcional        |
| email          | String   | unique          |
| hashedPassword | String   | bcryptjs hash   |
| role           | Role     | default: VIEWER |
| createdAt      | DateTime | auto            |
| updatedAt      | DateTime | auto            |

Tabelas auxiliares do Auth.js: `Account`, `Session`, `VerificationToken` (padrão do PrismaAdapter).

---

## Configuração (`src/lib/auth.ts`)

- **Provider:** Credentials (email + senha)
- **Adapter:** PrismaAdapter (Prisma client)
- **Session strategy:** JWT
- **Login page:** `/login`
- **Callbacks:**
  - `jwt` — injeta `id` e `role` no token
  - `session` — injeta `id` e `role` em `session.user`

### Acessando a sessão

**Server-side (Server Components, Route Handlers, Server Actions):**

```ts
import { auth } from "@/lib/auth";

const session = await auth();
// session.user.id, session.user.role, session.user.email
```

**Type augmentation:** `src/lib/auth.d.ts` estende `Session`, `User` e `JWT` com `role` e `id`.

---

## Regras de permissão

### Hierarquia

```
SUPER_ADMIN > ADMIN > VIEWER
```

### Regras de alteração de usuários

| Quem age    | Pode alterar  | NÃO pode alterar   |
| ----------- | ------------- | ------------------ |
| SUPER_ADMIN | ADMIN, VIEWER | outro SUPER_ADMIN  |
| ADMIN       | VIEWER        | ADMIN, SUPER_ADMIN |
| VIEWER      | ninguém       | —                  |

**Regra geral:** nenhum usuário pode alterar outro com permissão igual ou superior à sua.

### Implementação sugerida

```ts
function canModifyUser(actorRole: Role, targetRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    SUPER_ADMIN: 3,
    ADMIN: 2,
    VIEWER: 1,
  };
  return hierarchy[actorRole] > hierarchy[targetRole];
}
```

---

## Proteção de rotas

- **Dashboard:** `src/app/(dashboard)/layout.tsx` — redireciona para `/login` se `auth()` retorna null
- **Login:** `src/app/login/page.tsx` — redireciona para `/vendas` se já autenticado
