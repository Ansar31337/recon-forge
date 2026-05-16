import { NextRequest } from "next/server";
import { requireUser } from "@/features/auth/requireUser";
import { getDB } from "@/lib/db";
import { User } from "@/entities/User";
import { comparePassword, hashPassword } from "@/features/auth/password";
import { errorResponse, successMessage } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed) {
      return errorResponse("unauthenticated", "Please login first");
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return errorResponse(
        "validation",
        "Both old and new passwords are required",
      );
    }

    if (newPassword.length < 6) {
      return errorResponse(
        "validation",
        "New password must be at least 6 characters",
      );
    }

    const db = await getDB();
    const userRepo = db.getRepository(User);

    const user = await userRepo.findOne({
      where: { id: authed.id },
      select: ["id", "passwordHash", "mustChangePassword"],
    });

    if (!user) {
      return errorResponse("not_found", "User not found");
    }

    const valid = await comparePassword(oldPassword, user.passwordHash);
    if (!valid) {
      return errorResponse("validation", "Current password is incorrect");
    }

    const newHash = await hashPassword(newPassword);
    await userRepo.update(user.id, {
      passwordHash: newHash,
      mustChangePassword: false,
    });

    return successMessage("Password changed successfully");
  } catch (e) {
    console.error("Change password error:", e);
    return errorResponse("db_error", "Something went wrong");
  }
}
