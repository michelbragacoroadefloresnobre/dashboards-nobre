import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type Role = "SUPER_ADMIN" | "ADMIN" | "VIEWER";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
}

export interface AuthenticatedSession {
  user: AuthenticatedUser;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

export async function requireAuth(): Promise<AuthenticatedSession> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as unknown as AuthenticatedUser;
  return { user };
}

export async function requireRole(minimumRole: Role) {
  const session = await requireAuth();

  if (ROLE_HIERARCHY[session.user.role] < ROLE_HIERARCHY[minimumRole]) {
    redirect("/vendas");
  }

  return session;
}

export function canModifyUser(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[targetRole];
}
