import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Scan } from "@/entities/Scan";
import { HostResult } from "@/entities/HostResult";
import { requireUser } from "@/features/auth/requireUser";
import {
  resolveLimit,
  getMonthlyDownloadUsage,
  consumeDownload,
} from "@/features/credits/creditService";
import { errorResponse } from "@/lib/api-response";
import { csvEscape, safeFilename } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireUser(request);
    if (!authed) {
      return errorResponse("unauthenticated", "Please login first");
    }
    const { id } = await params;
    const format = request.nextUrl.searchParams.get("format") || "csv";
    const reqLimit = Number(request.nextUrl.searchParams.get("limit") || 1000);

    const db = await getDB();
    const scan = await db.getRepository(Scan).findOne({ where: { id } });
    if (!scan) {
      return errorResponse("not_found", "Scan not found");
    }
    if (authed.role !== "superadmin" && scan.userId !== authed.id) {
      return errorResponse("forbidden", "You do not have permission");
    }

    const limit = await resolveLimit(authed.id, authed.role);
    const usedRows = await getMonthlyDownloadUsage(authed.id);
    const remaining = limit.monthlySubdomainDownloadLimit - usedRows;

    if (remaining <= 0) {
      return errorResponse(
        "download_limit",
        "Monthly subdomain download limit reached",
      );
    }

    const finalLimit = Math.min(reqLimit, remaining);

    const hosts = await db.getRepository(HostResult).find({
      where: { scanId: id },
      order: { createdAt: "DESC" },
      take: finalLimit,
    });

    await consumeDownload(authed.id, id, hosts.length);

    const filename = safeFilename(
      `${scan.targetValue || "hosts"}_${id.slice(0, 8)}`,
    );

    if (format === "csv") {
      const headers = [
        "host",
        "displayTitle",
        "pageTitle",
        "detectedType",
        "ipAddress",
        "cnameRecords",
        "aRecords",
        "statusCode",
        "wafName",
        "source",
      ];
      const rows = hosts.map((h) =>
        [
          csvEscape(h.host),
          csvEscape(h.displayTitle),
          csvEscape(h.pageTitle),
          csvEscape(h.detectedType),
          csvEscape(h.ipAddress),
          csvEscape(
            h.cnameRecords
              ? Array.isArray(h.cnameRecords)
                ? h.cnameRecords.join("; ")
                : String(h.cnameRecords)
              : null,
          ),
          csvEscape(
            h.aRecords
              ? Array.isArray(h.aRecords)
                ? h.aRecords.join("; ")
                : String(h.aRecords)
              : null,
          ),
          h.statusCode != null ? String(h.statusCode) : "",
          csvEscape(h.wafName),
          csvEscape(h.source),
        ].join(","),
      );

      const csv = [headers.join(","), ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    if (format === "txt") {
      const lines = hosts.map(
        (h) =>
          `${h.host}${h.ipAddress ? ` [${h.ipAddress}]` : ""}${h.pageTitle ? ` - ${h.pageTitle}` : ""}`,
      );
      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${filename}.txt"`,
        },
      });
    }

    return NextResponse.json(hosts, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
