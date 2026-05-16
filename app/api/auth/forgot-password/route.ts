import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { PasswordResetRequest } from "@/entities/PasswordResetRequest";
import { errorResponse, successMessage } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { email, message } = await request.json();

    if (!email) {
      return errorResponse("validation", "Email is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("validation", "Invalid email format");
    }

    const db = await getDB();
    const resetRepo = db.getRepository(PasswordResetRequest);

    const resetRequest = resetRepo.create({
      email,
      message: message || null,
      status: "pending",
    });

    await resetRepo.save(resetRequest);

    return successMessage(
      "Password reset request submitted. Please contact superadmin.",
    );
  } catch (e) {
    console.error("Forgot password error:", e);
    return errorResponse("db_error", "Something went wrong");
  }
}
