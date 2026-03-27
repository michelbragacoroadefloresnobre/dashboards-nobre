---
name: permission-hierarchy
description: Hierarquia de permissões da aplicação (SUPER_ADMIN, ADMIN, VIEWER). Use ao implementar controle de acesso, proteção de rotas, ou lógica de autorização entre usuários.
user-invocable: true
---

# Hierarquia de Permissões

## Roles

| Role          | Nível | Descrição                                  |
| ------------- | ----- | ------------------------------------------ |
| `SUPER_ADMIN` | 3     | Controle total, sem restrições             |
| `ADMIN`       | 2     | Controle total, exceto sobre `SUPER_ADMIN` |
| `VIEWER`      | 1     | Apenas visualização                        |

## Regras de Autorização

### 1. Hierarquia estrita

- `SUPER_ADMIN` pode alterar `ADMIN` e `VIEWER`
- `ADMIN` pode alterar apenas `ADMIN` e `VIEWER`
- `VIEWER` não pode alterar ninguém

## Implementação

### Verificação de permissão para alteração de usuário

```typescript
function canModifyUser(actor: User, target: User): boolean {
  const hierarchy: Record<Role, number> = {
    VIEWER: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };

  return hierarchy[actor.role] >= hierarchy[target.role];
}
```

### Checklist ao implementar controle de acesso

- Sempre usar `canModifyUser` (ou lógica equivalente) antes de operações de escrita sobre usuários
- Proteger tanto no frontend (ocultar botões/ações) quanto no backend (validar na API)
- Retornar 403 quando a operação não for permitida
- Nunca confiar apenas na validação do frontend
