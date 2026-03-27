"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "../_actions/reset-password";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { GeneratedPasswordDialog } from "./generated-password-dialog";

type Role = "SUPER_ADMIN" | "ADMIN" | "VIEWER";

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  VIEWER: "Visualizador",
};

const roleBadgeColors: Record<Role, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-accent-green/10 text-accent-green",
  VIEWER: "bg-blue-100 text-blue-700",
};

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface UserManagementProps {
  users: User[];
  currentUserId: string;
  currentUserRole: Role;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function UserManagement({
  users,
  currentUserId,
  currentUserRole,
}: UserManagementProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<{
    password: string;
    userName: string;
  } | null>(null);

  const [isResetting, startResetTransition] = useTransition();
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const handleCreated = useCallback(
    (password: string, userName: string) => {
      setCreateOpen(false);
      setPasswordInfo({ password, userName });
      refresh();
    },
    [refresh],
  );

  function handleResetPassword(userId: string, userName: string, formData: FormData) {
    setResettingUserId(userId);
    startResetTransition(async () => {
      const result = await resetPassword(null, formData);
      if (result.success && result.generatedPassword) {
        setPasswordInfo({ password: result.generatedPassword, userName });
      }
      setResettingUserId(null);
    });
  }

  function canModify(targetRole: Role) {
    const hierarchy: Record<Role, number> = {
      VIEWER: 0,
      ADMIN: 1,
      SUPER_ADMIN: 2,
    };
    return hierarchy[currentUserRole] >= hierarchy[targetRole];
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Gerenciar usuários
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado
            {users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-accent-green px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Novo usuário
        </button>
      </div>

      {/* User list */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-card-alt">
              <th className="text-left text-xs font-medium text-text-muted px-5 py-3">
                Usuário
              </th>
              <th className="text-left text-xs font-medium text-text-muted px-5 py-3">
                Cargo
              </th>
              <th className="text-left text-xs font-medium text-text-muted px-5 py-3">
                Criado em
              </th>
              <th className="text-right text-xs font-medium text-text-muted px-5 py-3">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const canEdit = canModify(user.role) && !isCurrentUser;

              return (
                <tr key={user.id} className="hover:bg-bg-card-alt/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent-green/10 border border-accent-green/20 flex items-center justify-center text-xs font-bold text-accent-green shrink-0">
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-text-muted font-normal">
                              (você)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${roleBadgeColors[user.role]}`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-text-secondary">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {canEdit && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditUser(user)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-card-alt transition-colors cursor-pointer"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <form
                          action={(formData) =>
                            handleResetPassword(user.id, user.name, formData)
                          }
                        >
                          <input
                            type="hidden"
                            name="userId"
                            value={user.id}
                          />
                          <button
                            type="submit"
                            disabled={isResetting && resettingUserId === user.id}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-50"
                            title="Resetar senha"
                          >
                            {isResetting && resettingUserId === user.id
                              ? "..."
                              : "Resetar senha"}
                          </button>
                        </form>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent-red hover:bg-red-50 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <EditUserDialog
        open={!!editUser}
        onClose={() => setEditUser(null)}
        onUpdated={refresh}
        user={editUser}
      />

      <DeleteUserDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={refresh}
        user={deleteTarget}
      />

      <GeneratedPasswordDialog
        open={!!passwordInfo}
        onClose={() => setPasswordInfo(null)}
        password={passwordInfo?.password ?? ""}
        userName={passwordInfo?.userName ?? ""}
      />
    </>
  );
}
