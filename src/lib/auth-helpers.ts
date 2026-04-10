import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public upgrade?: boolean
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requireAuth() {
  const session = await auth();
  if (!session || !session.user?.email) {
    throw new ApiError(401, "UNAUTHORIZED", "Not authenticated");
  }
  return session;
}

export async function getUserSettings(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { settings: true },
  });
  return user?.settings ?? null;
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return {
      status: err.statusCode,
      body: {
        error: {
          code: err.code,
          message: err.message,
          ...(err.upgrade ? { upgrade: true } : {}),
        },
      },
    };
  }

  console.error("Unhandled error:", err);
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
  };
}
