import { NextRequest } from "next/server";
import { requireUser } from "@/features/auth/requireUser";
import { sanitizeUser } from "@/features/auth/sanitizeUser";
import { errorResponse, success } from "@/lib/api-response";
import { getDB } from "@/lib/db";
import { User } from "@/entities/User";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed) {
      return errorResponse("unauthenticated", "Please login first");
    }

    const db = await getDB();
    const user = await db.getRepository(User).findOne({
      where: { id: authed.id },
    });

    if (!user) {
      return errorResponse("unauthenticated", "User not found");
    }

    if (!user.isActive) {
      return errorResponse("unauthenticated", "Account is deactivated");
    }

    return success(sanitizeUser(user));
  } catch (e) {
    console.error("Me error:", e);
    return errorResponse("db_error", "Something went wrong");
  }
}
