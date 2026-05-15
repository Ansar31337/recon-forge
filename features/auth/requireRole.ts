import { NextRequest } from "next/server";
import { requireUser, AuthedUser } from "./requireUser";

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[],
): Promise<AuthedUser | null> {
  const user = await requireUser(request);
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) return null;
  return user;
}
