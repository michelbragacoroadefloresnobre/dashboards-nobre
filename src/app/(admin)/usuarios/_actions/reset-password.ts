"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { requireRole, canModifyUser } from "@/lib/auth-utils";

interface ActionState {
  error?: string;
  success?: string;
  generatedPassword?: string;
}

function generatePassword() {
  return crypto.randomBytes(6).toString("base64url").slice(0, 10);
}

export async function resetPassword(
  _previousState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const userId = formData.get("userId") as string;

  if (!userId) {
    return { error: "Usuário não identificado." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!target) {
    return { error: "Usuário não encontrado." };
  }

  if (!canModifyUser(session.user.role, target.role)) {
    return { error: "Você não tem permissão para resetar a senha deste usuário." };
  }

  const password = generatePassword();
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { hashedPassword },
  });

  return { success: "Senha resetada com sucesso.", generatedPassword: password };
}
