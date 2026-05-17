import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { Scan } from "@/entities/Scan";
import { Target } from "@/entities/Target";
import { HostResult } from "@/entities/HostResult";
import { TechFingerprint } from "@/entities/TechFingerprint";
import { Endpoint } from "@/entities/Endpoint";
import { CveMatch } from "@/entities/CveMatch";
import { ScanProgressEvent } from "@/entities/ScanProgressEvent";
import { ApiUsageLog } from "@/entities/ApiUsageLog";
import { requireUser } from "@/features/auth/requireUser";
import { errorResponse, successMessage } from "@/lib/api-response";

export async function DELETE(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed) return errorResponse("unauthenticated", "Please login first");
    if (authed.role === "superadmin") {
      return errorResponse(
        "forbidden",
        "Superadmin cannot delete scan history",
      );
    }

    const db = await getDB();
    const userScans = await db.getRepository(Scan).find({
      where: { userId: authed.id },
      select: ["id"],
    });

    if (userScans.length === 0) {
      return successMessage("No scan history to delete");
    }

    const scanIds = userScans.map((s) => s.id);

    const hostResults = await db.getRepository(HostResult).find({
      where: scanIds.map((sid) => ({ scanId: sid })),
      select: ["id"],
    });
    const hostResultIds = hostResults.map((h) => h.id);

    if (hostResultIds.length) {
      await db
        .getRepository(CveMatch)
        .delete(hostResultIds.map((hid) => ({ hostResultId: hid }) as any));
      await db
        .getRepository(Endpoint)
        .delete(hostResultIds.map((hid) => ({ hostResultId: hid }) as any));
      await db
        .getRepository(TechFingerprint)
        .delete(hostResultIds.map((hid) => ({ hostResultId: hid }) as any));
    }

    await db
      .getRepository(HostResult)
      .delete(scanIds.map((sid) => ({ scanId: sid }) as any));
    await db
      .getRepository(Target)
      .delete(scanIds.map((sid) => ({ scanId: sid }) as any));
    await db
      .getRepository(ScanProgressEvent)
      .delete(scanIds.map((sid) => ({ scanId: sid })));

    await db.getRepository(ApiUsageLog).update(
      scanIds.map((sid) => ({ scanId: sid })),
      { scanId: null },
    );

    await db
      .getRepository(Scan)
      .delete(scanIds.map((sid) => ({ id: sid }) as any));

    return successMessage(
      `Deleted ${userScans.length} scan(s) and all related data`,
    );
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
