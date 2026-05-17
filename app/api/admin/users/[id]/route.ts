import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { User } from "@/entities/User";
import { requireUser } from "@/features/auth/requireUser";
import { hashPassword } from "@/features/auth/password";
import { sanitizeUser } from "@/features/auth/sanitizeUser";
import { errorResponse, success, successMessage } from "@/lib/api-response";
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
    const db = await getDB();
    const userRepo = db.getRepository(User);
    const user = await userRepo.findOne({ where: { id } });
    if (!user) {
      return errorResponse("not_found", "User not found");
    }
    const body = await request.json();
    const allowed = pickAllowedFields(body, ["name", "role", "isActive"]);
    if (Object.keys(allowed).length === 0) {
      return errorResponse("validation", "No valid fields to update");
    }
    await userRepo.update(id, allowed);
    const updated = await userRepo.findOne({ where: { id } });
    return success(sanitizeUser(updated!));
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const { id } = await params;
    const db = await getDB();
    const userRepo = db.getRepository(User);
    const user = await userRepo.findOne({ where: { id } });
    if (!user) {
      return errorResponse("not_found", "User not found");
    }
    await userRepo.delete(id);
    return successMessage("User deleted successfully");
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
