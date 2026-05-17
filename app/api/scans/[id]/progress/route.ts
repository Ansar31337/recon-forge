import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { Scan } from "@/entities/Scan";
import { ScanProgressEvent } from "@/entities/ScanProgressEvent";
import { requireUser } from "@/features/auth/requireUser";
import { errorResponse, success } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireUser(request);
    if (!authed) return errorResponse("unauthenticated", "Please login first");
    const { id } = await params;
    const db = await getDB();
    const scan = await db
      .getRepository(Scan)
      .findOne({ where: { id }, select: ["id", "userId"] });
    if (!scan) return errorResponse("not_found", "Scan not found");
    if (authed.role !== "superadmin" && scan.userId !== authed.id) {
      return errorResponse("forbidden", "You do not have permission");
    }
    const progress = await db.getRepository(ScanProgressEvent).find({
      where: { scanId: id },
      order: { createdAt: "ASC" },
    });
    return success(progress);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
