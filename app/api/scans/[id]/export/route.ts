import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Scan } from "@/entities/Scan";
import { HostResult } from "@/entities/HostResult";
import { TechFingerprint } from "@/entities/TechFingerprint";
import { Endpoint } from "@/entities/Endpoint";
import { CveMatch } from "@/entities/CveMatch";
import { requireUser } from "@/features/auth/requireUser";
import { checkAndConsume } from "@/features/credits/creditService";
import {
  generateJsonExport,
  generateCsvExport,
  generateTxtExport,
} from "@/features/scans/exportScan";
import type { ExportSection } from "@/features/scans/exportScan";
import { errorResponse } from "@/lib/api-response";
import { safeFilename } from "@/lib/utils";

const ALL_SECTIONS: ExportSection[] = [
  "hosts",
  "selectedHosts",
  "endpoints",
  "tech",
  "ports",
  "dns",
  "waf",
  "cve",
  "progress",
];

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
    const format = request.nextUrl.searchParams.get("format") || "json";
    const sectionsParam = request.nextUrl.searchParams.get("sections");

    let sections: ExportSection[] = [];
    if (sectionsParam) {
      const requested = sectionsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as ExportSection[];
      sections = requested.filter((s) => ALL_SECTIONS.includes(s));
      if (authed.role === "regular") {
        sections = sections.filter((s) => s !== "cve");
      }
    }

    const db = await getDB();
    const scan = await db.getRepository(Scan).findOne({ where: { id } });
    if (!scan) {
      return errorResponse("not_found", "Scan not found");
    }
    if (authed.role !== "superadmin" && scan.userId !== authed.id) {
      return errorResponse("forbidden", "You do not have permission");
    }

    const hosts = await db.getRepository(HostResult).find({
      where: { scanId: id },
      order: { createdAt: "DESC" },
    });

    const selectedHosts = hosts.filter((h) => h.selectedForScan);

    const hostIds = hosts.map((h) => h.id);

    let cveMatches: CveMatch[] = [];
    if (authed.role !== "regular" && scan.enableCveMatching && hostIds.length) {
      cveMatches = await db.getRepository(CveMatch).find({
        where: hostIds.map((hid) => ({ hostResultId: hid })),
      });
    }

    const techFingerprints = hostIds.length
      ? await db
          .getRepository(TechFingerprint)
          .find({ where: hostIds.map((hid) => ({ hostResultId: hid })) })
      : [];

    const endpoints = hostIds.length
      ? await db
          .getRepository(Endpoint)
          .find({ where: hostIds.map((hid) => ({ hostResultId: hid })) })
      : [];

    const consumed = await checkAndConsume(authed.id, "export", id);
    if (!consumed.ok) {
      return errorResponse(
        "credit_limit",
        consumed.message || "Export limit reached",
      );
    }

    const filename = safeFilename(
      `${scan.targetValue || "scan"}_${id.slice(0, 8)}`,
    );

    if (format === "csv") {
      const csv = generateCsvExport(hosts, cveMatches);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    if (format === "txt") {
      const txt = generateTxtExport(hosts);
      return new NextResponse(txt, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${filename}.txt"`,
        },
      });
    }

    const json = generateJsonExport(
      scan,
      hosts,
      selectedHosts,
      techFingerprints,
      endpoints,
      cveMatches,
      sections,
    );
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
