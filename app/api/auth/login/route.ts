import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { User } from "@/entities/User";
import { comparePassword } from "@/features/auth/password";
import { signToken } from "@/features/auth/jwt";
import { sanitizeUser } from "@/features/auth/sanitizeUser";
import { errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return errorResponse("validation", "Email and password are required");
    }

    const db = await getDB();
    const userRepo = db.getRepository(User);

    const user = await userRepo.findOne({
      where: { email },
      select: [
        "id",
        "name",
        "email",
        "passwordHash",
        "role",
        "isActive",
        "mustChangePassword",
        "createdAt",
      ],
    });

    if (!user) {
      return errorResponse("unauthenticated", "Invalid email or password");
    }

    if (!user.isActive) {
      return errorResponse(
        "unauthenticated",
        "Your account is pending activation. Please wait for superadmin approval.",
      );
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return errorResponse("unauthenticated", "Invalid email or password");
    }

    const maxAge = rememberMe
      ? Number(process.env.COOKIE_MAXAGE_REMEMBER || 604800)
      : Number(process.env.COOKIE_MAXAGE_SHORT || 7200);

    const token = signToken({ sub: user.id, role: user.role }, maxAge);

    const response = NextResponse.json({
      success: true,
      data: sanitizeUser(user),
      redirect:
        user.role === "superadmin"
          ? "/super-admin"
          : user.role === "enterprise"
            ? "/dashboard"
            : "/regular",
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });

    return response;
  } catch (e) {
    console.error("Login error:", e);
    return errorResponse("db_error", "Something went wrong");
  }
}
