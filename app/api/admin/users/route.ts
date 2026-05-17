import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { User } from "@/entities/User";
import { requireUser } from "@/features/auth/requireUser";
import { hashPassword } from "@/features/auth/password";
import { sanitizeUser } from "@/features/auth/sanitizeUser";
import { errorResponse, success, successMessage } from "@/lib/api-response";
import { pickAllowedFields } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const db = await getDB();
    const users = await db
      .getRepository(User)
      .find({ order: { createdAt: "DESC" } });
    return success(users.map(sanitizeUser));
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}

export async function POST(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password || !role) {
      return errorResponse("validation", "All fields are required");
    }
    if (password.length < 6) {
      return errorResponse(
        "validation",
        "Password must be at least 6 characters",
      );
    }
    const db = await getDB();
    const userRepo = db.getRepository(User);
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      return errorResponse("email_taken", "Email already exists");
    }
    const passwordHash = await hashPassword(password);
    const user = userRepo.create({
      name,
      email,
      passwordHash,
      role,
      isActive: true,
    });
    await userRepo.save(user);
    return success(sanitizeUser(user), 201);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
