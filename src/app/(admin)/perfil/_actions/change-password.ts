"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

interface ActionState {
  error?: string;
  success?: string;
}

export async function changePassword(
  _previousState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAuth();

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Preencha todos os campos." };
  }

  if (newPassword.length < 6) {
    return { error: "A nova senha deve ter pelo menos 6 caracteres." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true },
  });

  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  const passwordMatch = await bcrypt.compare(
    currentPassword,
    user.hashedPassword,
  );
  if (!passwordMatch) {
    return { error: "Senha atual incorreta." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hashedPassword },
  });

  return { success: "Senha alterada com sucesso." };
}
