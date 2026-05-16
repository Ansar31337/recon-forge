import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { User } from "@/entities/User";
import { hashPassword } from "@/features/auth/password";
import { errorResponse, successMessage } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return errorResponse("validation", "All fields are required");
    }

    if (name.length < 2) {
      return errorResponse("validation", "Name must be at least 2 characters");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("validation", "Invalid email format");
    }

    if (password.length < 6) {
      return errorResponse(
        "validation",
        "Password must be at least 6 characters",
      );
    }

    if (role !== "enterprise" && role !== "regular") {
      return errorResponse(
        "validation",
        "Invalid role. Choose enterprise or regular",
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
      isActive: false,
      mustChangePassword: false,
    });

    await userRepo.save(user);

    return successMessage(
      "Account created. Please wait for superadmin approval.",
    );
  } catch (e) {
    console.error("Signup error:", e);
    return errorResponse("db_error", "Something went wrong");
  }
}
