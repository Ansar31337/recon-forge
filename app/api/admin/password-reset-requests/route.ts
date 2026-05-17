import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
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
    const requests = await db.getRepository(PasswordResetRequest).find({
      order: { createdAt: "DESC" },
    });
    return success(requests);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
