"use server";

import prisma from "@/lib/prisma";
import { requireRole, canModifyUser } from "@/lib/auth-utils";

interface ActionState {
  error?: string;
  success?: string;
}

export async function deleteUser(
  _previousState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const userId = formData.get("userId") as string;

  if (!userId) {
    return { error: "Usuário não identificado." };
  }

  if (userId === session.user.id) {
    return { error: "Você não pode excluir sua própria conta." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!target) {
    return { error: "Usuário não encontrado." };
  }

  if (!canModifyUser(session.user.role, target.role)) {
    return { error: "Você não tem permissão para excluir este usuário." };
  }

  await prisma.user.delete({ where: { id: userId } });

  return { success: "Usuário excluído permanentemente." };
}
