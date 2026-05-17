import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { PasswordResetRequest } from "@/entities/PasswordResetRequest";
import { User } from "@/entities/User";
import { requireUser } from "@/features/auth/requireUser";
import { hashPassword } from "@/features/auth/password";
import { errorResponse, successMessage } from "@/lib/api-response";
import { pickAllowedFields } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const { id } = await params;
    const body = await request.json();
    const db = await getDB();
    const resetRepo = db.getRepository(PasswordResetRequest);
    const resetReq = await resetRepo.findOne({ where: { id } });
    if (!resetReq) {
      return errorResponse("not_found", "Request not found");
    }

    const allowed = pickAllowedFields(body, ["status", "adminNote"]);
    if (allowed.status === "completed" && body.newPassword) {
      const user = await db
        .getRepository(User)
        .findOne({ where: { email: resetReq.email } });
      if (user) {
        const passwordHash = await hashPassword(body.newPassword);
        await db
          .getRepository(User)
          .update(user.id, { passwordHash, mustChangePassword: true });
      }
      await resetRepo.update(id, { ...allowed, handledAt: new Date() });
    } else {
      await resetRepo.update(id, allowed);
    }
    return successMessage("Request updated");
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
