"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

interface ActionState {
  error?: string;
  success?: string;
}

export async function updateProfile(
  _previousState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAuth();

  const name = (formData.get("name") as string)?.trim();

  if (!name) {
    return { error: "O nome é obrigatório." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  return { success: "Perfil atualizado com sucesso." };
}
