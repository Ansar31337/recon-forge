import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { User } from "@/entities/User";
import { requireUser } from "@/features/auth/requireUser";
import { hashPassword } from "@/features/auth/password";
import { errorResponse, successMessage } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const { id } = await params;
    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 6) {
      return errorResponse(
        "validation",
        "Password must be at least 6 characters",
      );
    }
    const db = await getDB();
    const userRepo = db.getRepository(User);
    const user = await userRepo.findOne({ where: { id } });
    if (!user) {
      return errorResponse("not_found", "User not found");
    }
    const passwordHash = await hashPassword(newPassword);
    await userRepo.update(id, { passwordHash, mustChangePassword: true });
    return successMessage("Password reset successfully");
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
