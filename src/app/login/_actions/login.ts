"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function login(
  _previousState: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/vendas",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return "Email ou senha inválidos.";
      }
      return "Ocorreu um erro ao fazer login.";
    }
    throw error;
  }
}
