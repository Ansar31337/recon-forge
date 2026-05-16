import { NextRequest, NextResponse } from "next/server";
import { successMessage } from "@/lib/api-response";

export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set("auth_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (e) {
    console.error("Logout error:", e);
    return NextResponse.json(
      { error: "db_error", message: "Something went wrong" },
      { status: 500 },
    );
  }
}
