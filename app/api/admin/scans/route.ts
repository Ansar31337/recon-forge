import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { Scan } from "@/entities/Scan";
import { User } from "@/entities/User";
import { requireUser } from "@/features/auth/requireUser";
import { errorResponse, success } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const db = await getDB();
    const scans = await db.getRepository(Scan).find({
      order: { createdAt: "DESC" },
    });
    const userIds = [...new Set(scans.map((s) => s.userId))];
    const users = userIds.length
      ? await db.getRepository(User).find({
          where: userIds.map((id) => ({ id })),
          select: ["id", "name", "email", "role"],
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    const enriched = scans.map((s) => ({
      ...s,
      user: userMap.get(s.userId) || null,
    }));
    return success(enriched);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
