import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { Scan } from "@/entities/Scan";
import { requireUser } from "@/features/auth/requireUser";
import { errorResponse, successMessage } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireUser(request);
    if (!authed) {
      return errorResponse("unauthenticated", "Please login first");
    }
    const { id } = await params;
    const db = await getDB();
    const scan = await db.getRepository(Scan).findOne({ where: { id } });
    if (!scan) {
      return errorResponse("not_found", "Scan not found");
    }
    if (authed.role !== "superadmin" && scan.userId !== authed.id) {
      return errorResponse("forbidden", "You do not have permission");
    }
    await db
      .getRepository(Scan)
      .update(id, { cancelRequested: true, status: "cancelled" });
    return successMessage("Scan cancelled");
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
