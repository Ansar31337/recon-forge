import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "./jwt";
import { getDB } from "@/lib/db";
import { User } from "@/entities/User";

export interface AuthedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export async function requireUser(
  request: NextRequest,
): Promise<AuthedUser | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;

  const payload: JwtPayload | null = verifyToken(token);
  if (!payload) return null;

  const db = await getDB();
  const user = await db.getRepository(User).findOne({
    where: { id: payload.sub },
    select: ["id", "name", "email", "role", "isActive"],
  });

  if (!user || !user.isActive) return null;
  return user;
}
