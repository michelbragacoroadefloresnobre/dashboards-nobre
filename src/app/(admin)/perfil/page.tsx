import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { ProfileForm } from "./_components/profile-form";

export const metadata: Metadata = {
  title: "Meu perfil",
};

export default async function ProfilePage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    return null;
  }

  return (
    <ProfileForm
      user={{
        name: user.name ?? "",
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
