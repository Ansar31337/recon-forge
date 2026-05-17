import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { User } from "@/entities/User";
import { Scan } from "@/entities/Scan";
import { SupportMessage } from "@/entities/SupportMessage";
import { PasswordResetRequest } from "@/entities/PasswordResetRequest";
import { requireUser } from "@/features/auth/requireUser";
import { errorResponse, success } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }

    const db = await getDB();

    const totalUsers = await db.getRepository(User).count();
    const activeUsers = await db
      .getRepository(User)
      .count({ where: { isActive: true } });
    const pendingUsers = await db
      .getRepository(User)
      .count({ where: { isActive: false } });
    const enterpriseUsers = await db
      .getRepository(User)
      .count({ where: { role: "enterprise" } });
    const regularUsers = await db
      .getRepository(User)
      .count({ where: { role: "regular" } });
    const totalScans = await db.getRepository(Scan).count();
    const runningScans = await db
      .getRepository(Scan)
      .count({ where: { status: "running" } });
    const completedScans = await db
      .getRepository(Scan)
      .count({ where: { status: "completed" } });
    const failedScans = await db
      .getRepository(Scan)
      .count({ where: { status: "failed" } });
    const openMessages = await db
      .getRepository(SupportMessage)
      .count({ where: { status: "open" } });
    const upgradeRequests = await db
      .getRepository(SupportMessage)
      .count({ where: { category: "upgrade_request" } });
    const pendingPasswordResets = await db
      .getRepository(PasswordResetRequest)
      .count({ where: { status: "pending" } });

    return success({
      totalUsers,
      activeUsers,
      pendingUsers,
      enterpriseUsers,
      regularUsers,
      totalScans,
      runningScans,
      completedScans,
      failedScans,
      openMessages,
      upgradeRequests,
      pendingPasswordResets,
    });
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
