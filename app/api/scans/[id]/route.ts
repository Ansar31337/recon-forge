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
import { errorResponse, success, successMessage } from "@/lib/api-response";

function clampLimit(val: number | null, defaultVal = 20): number {
  const n = val ?? defaultVal;
  return Math.max(10, Math.min(100, n));
}

function clampPage(val: number | null): number {
  const n = val ?? 1;
  return Math.max(1, n);
}

function paginate<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
) {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    items,
    pagination: { currentPage: page, limit, totalItems, totalPages },
  };
}

function normalizeHost(host: string): string {
  return host
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/#.*$/, "");
}

function dedupeHosts(hosts: HostResult[]): HostResult[] {
  const seen = new Set<string>();
  const out: HostResult[] = [];
  for (const h of hosts) {
    const key = `${h.scanId}|${normalizeHost(h.host)}|${h.source || "unknown"}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(h);
    }
  }
  return out;
}

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
    const db = await getDB();

    const scan = await db.getRepository(Scan).findOne({ where: { id } });
    if (!scan) {
      return errorResponse("not_found", "Scan not found");
    }
    if (authed.role !== "superadmin" && scan.userId !== authed.id) {
      return errorResponse("forbidden", "You do not have permission");
    }

    const sp = new URL(request.url).searchParams;

    const hostPage = clampPage(Number(sp.get("hostPage")) || null);
    const hostLimit = clampLimit(Number(sp.get("hostLimit")) || null);
    const selectedPage = clampPage(Number(sp.get("selectedPage")) || null);
    const selectedLimit = clampLimit(Number(sp.get("selectedLimit")) || null);
    const endpointPage = clampPage(Number(sp.get("endpointPage")) || null);
    const endpointLimit = clampLimit(Number(sp.get("endpointLimit")) || null);
    const techPage = clampPage(Number(sp.get("techPage")) || null);
    const techLimit = clampLimit(Number(sp.get("techLimit")) || null);
    const cvePage = clampPage(Number(sp.get("cvePage")) || null);
    const cveLimit = clampLimit(Number(sp.get("cveLimit")) || null);

    const progress = await db.getRepository(ScanProgressEvent).find({
      where: { scanId: id },
      order: { createdAt: "ASC" },
    });

    const allHostResults = await db.getRepository(HostResult).find({
      where: { scanId: id },
      order: { createdAt: "DESC" },
    });
    const dedupedAll = dedupeHosts(allHostResults);
    const allHostIds = dedupedAll.map((h) => h.id);

    const hostStart = (hostPage - 1) * hostLimit;
    const hostItems = dedupedAll.slice(hostStart, hostStart + hostLimit);

    const selectedHostsAll = dedupedAll.filter((h) => h.selectedForScan);
    const selectedStart = (selectedPage - 1) * selectedLimit;
    const selectedItems = selectedHostsAll.slice(
      selectedStart,
      selectedStart + selectedLimit,
    );

    const allEndpoints = allHostIds.length
      ? await db.getRepository(Endpoint).find({
          where: allHostIds.map((hid) => ({ hostResultId: hid })),
          order: { depth: "ASC" },
        })
      : [];
    const endpointStart = (endpointPage - 1) * endpointLimit;
    const endpointItems = allEndpoints.slice(
      endpointStart,
      endpointStart + endpointLimit,
    );

    const allTechs = allHostIds.length
      ? await db.getRepository(TechFingerprint).find({
          where: allHostIds.map((hid) => ({ hostResultId: hid })),
          order: { name: "ASC" },
        })
      : [];
    const dedupedTechs: TechFingerprint[] = [];
    const techSeen = new Set<string>();
    for (const t of allTechs) {
      const key = `${t.hostResultId}|${t.name}|${t.version || ""}`;
      if (!techSeen.has(key)) {
        techSeen.add(key);
        dedupedTechs.push(t);
      }
    }
    const techStart = (techPage - 1) * techLimit;
    const techItems = dedupedTechs.slice(techStart, techStart + techLimit);

    let allCves: CveMatch[] = [];
    if (authed.role !== "regular" && allHostIds.length) {
      allCves = await db.getRepository(CveMatch).find({
        where: allHostIds.map((hid) => ({ hostResultId: hid })),
        order: { cveId: "ASC" },
      });
    }
    const dedupedCves: CveMatch[] = [];
    const cveSeen = new Set<string>();
    for (const c of allCves) {
      const key = `${c.hostResultId}|${c.techFingerprintId || "null"}|${c.cveId}`;
      if (!cveSeen.has(key)) {
        cveSeen.add(key);
        dedupedCves.push(c);
      }
    }
    const cveStart = (cvePage - 1) * cveLimit;
    const cveItems = dedupedCves.slice(cveStart, cveStart + cveLimit);

    const discoveredSubdomains = dedupedAll.map((h) => ({
      id: h.id,
      host: h.host,
      displayTitle: h.displayTitle,
      detectedType: h.detectedType,
      rootDomain: h.rootDomain,
      source: h.source,
    }));

    const counts = {
      hostResults: dedupedAll.length,
      selectedHostResults: selectedHostsAll.length,
      endpoints: allEndpoints.length,
      technologies: dedupedTechs.length,
      cveMatches: dedupedCves.length,
    };

    return success({
      scan,
      counts,
      hostResults: paginate(hostItems, dedupedAll.length, hostPage, hostLimit),
      selectedHostResults: paginate(
        selectedItems,
        selectedHostsAll.length,
        selectedPage,
        selectedLimit,
      ),
      endpoints: paginate(
        endpointItems,
        allEndpoints.length,
        endpointPage,
        endpointLimit,
      ),
      technologies: paginate(
        techItems,
        dedupedTechs.length,
        techPage,
        techLimit,
      ),
      cveMatches: paginate(cveItems, dedupedCves.length, cvePage, cveLimit),
      progress,
      discoveredSubdomains,
    });
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
    if (!authed) return errorResponse("unauthenticated", "Please login first");
    const { id } = await params;
    const db = await getDB();
    const scan = await db.getRepository(Scan).findOne({ where: { id } });
    if (!scan) return errorResponse("not_found", "Scan not found");
    if (authed.role !== "superadmin" && scan.userId !== authed.id) {
      return errorResponse("forbidden", "You do not have permission");
    }
    await db.getRepository(CveMatch).delete({ hostResultId: id } as any);
    await db.getRepository(Endpoint).delete({ hostResultId: id } as any);
    await db.getRepository(TechFingerprint).delete({ hostResultId: id } as any);
    await db.getRepository(HostResult).delete({ scanId: id } as any);
    await db.getRepository(Target).delete({ scanId: id } as any);
    await db.getRepository(ScanProgressEvent).delete({ scanId: id });
    await db.getRepository(ApiUsageLog).delete({ scanId: id });
    await db.getRepository(Scan).delete({ id } as any);
    return successMessage("Scan deleted successfully");
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
