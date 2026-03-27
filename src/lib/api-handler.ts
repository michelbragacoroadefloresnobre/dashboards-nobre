import { auth } from "@/lib/auth";
import type { AuthenticatedSession, Role } from "@/lib/auth-utils";
import { HttpException } from "@/lib/http-exception";
import type { NextRequest } from "next/server";

type ApiHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

type AuthenticatedHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  session: AuthenticatedSession,
) => Promise<Response>;

interface WithAuthOptions {
  minimumRole?: Role;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof HttpException && error.status < 500) {
        return Response.json(
          { error: error.message },
          { status: error.status },
        );
      }

      console.error("[API Error]", error);
      return Response.json(
        { error: "Algo deu errado. Contate o suporte." },
        { status: 500 },
      );
    }
  };
}

export function withAuth(
  handler: AuthenticatedHandler,
  options: WithAuthOptions = {},
): ApiHandler {
  return async (request, context) => {
    const session = await auth();

    if (!session?.user) {
      throw new HttpException(401, "Não autenticado.");
    }

    const user = session.user as unknown as AuthenticatedSession["user"];

    if (
      options.minimumRole &&
      ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[options.minimumRole]
    ) {
      throw new HttpException(403, "Permissão insuficiente.");
    }

    return handler(request, context, { user });
  };
}
