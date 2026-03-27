"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { requireRole, canModifyUser, type Role } from "@/lib/auth-utils";

interface ActionState {
  error?: string;
  success?: string;
  generatedPassword?: string;
}

const ALLOWED_ROLES: Role[] = ["ADMIN", "VIEWER"];

function generatePassword() {
  return crypto.randomBytes(6).toString("base64url").slice(0, 10);
}

export async function createUser(
  _previousState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as Role;

  if (!name || !email || !role) {
    return { error: "Preencha todos os campos." };
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return { error: "Cargo inválido." };
  }

  if (!canModifyUser(session.user.role, role)) {
    return { error: "Você não tem permissão para criar este tipo de usuário." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário com este email." };
  }

  const password = generatePassword();
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, hashedPassword, role },
  });

  return { success: "Usuário criado com sucesso.", generatedPassword: password };
}
