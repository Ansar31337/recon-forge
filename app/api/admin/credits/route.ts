import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { RoleCreditDefault } from "@/entities/RoleCreditDefault";
import { requireUser } from "@/features/auth/requireUser";
import { errorResponse, success } from "@/lib/api-response";
import { pickAllowedFields } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const db = await getDB();
    const credits = await db
      .getRepository(RoleCreditDefault)
      .find({ order: { role: "ASC" } });
    return success(credits);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const { id, ...fields } = await request.json();
    if (!id) {
      return errorResponse("validation", "Role ID is required");
    }
    const allowed = pickAllowedFields(fields, [
      "dailyScanLimit",
      "maxCrawlDepth",
      "cveEnabled",
      "monthlySubdomainDownloadLimit",
    ]);
    if (Object.keys(allowed).length === 0) {
      return errorResponse("validation", "No valid fields");
    }
    const db = await getDB();
    await db.getRepository(RoleCreditDefault).update(id, allowed);
    const updated = await db
      .getRepository(RoleCreditDefault)
      .findOne({ where: { id } });
    return success(updated);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
