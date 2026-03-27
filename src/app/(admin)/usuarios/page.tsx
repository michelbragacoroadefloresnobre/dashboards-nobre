import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { UserManagement } from "./_components/user-management";

export const metadata: Metadata = {
  title: "Gerenciar usuários",
};

export default async function UsersPage() {
  const session = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <UserManagement
      users={users.map((u) => ({
        id: u.id,
        name: u.name ?? "",
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      }))}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
