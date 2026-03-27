"use server";

import prisma from "@/lib/prisma";
import { requireRole, canModifyUser, type Role } from "@/lib/auth-utils";

interface ActionState {
  error?: string;
  success?: string;
}

const ALLOWED_ROLES: Role[] = ["ADMIN", "VIEWER"];

export async function updateUser(
  _previousState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const userId = formData.get("userId") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as Role;

  if (!userId || !name || !email || !role) {
    return { error: "Preencha todos os campos." };
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return { error: "Cargo inválido." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!target) {
    return { error: "Usuário não encontrado." };
  }

  if (!canModifyUser(session.user.role, target.role)) {
    return { error: "Você não tem permissão para editar este usuário." };
  }

  if (!canModifyUser(session.user.role, role)) {
    return { error: "Você não tem permissão para atribuir este cargo." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    return { error: "Já existe outro usuário com este email." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name, email, role },
  });

  return { success: "Usuário atualizado com sucesso." };
}
