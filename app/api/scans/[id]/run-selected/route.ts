import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { Scan } from "@/entities/Scan";
import { HostResult } from "@/entities/HostResult";
import { ScanProgressEvent } from "@/entities/ScanProgressEvent";
import { TechFingerprint } from "@/entities/TechFingerprint";
import { Endpoint } from "@/entities/Endpoint";
import { CveMatch } from "@/entities/CveMatch";
import { requireUser } from "@/features/auth/requireUser";
import { resolveLimit } from "@/features/credits/creditService";
import {
  applyToggleDependencies,
  validateRunSelectedBody,
} from "@/features/scans/scanValidation";
import { delay } from "@/features/scans/cveMatch";
import { resolveDnsForHost } from "@/features/scans/dnsHelper";
import { probeHost } from "@/features/scans/probe";
import { portScan } from "@/features/scans/portScan";
import {
  detectManualTech,
  wappalyzerFingerprint,
  detectWaf,
  mergeTechResults,
} from "@/features/scans/techDetect";
import { crawler } from "@/features/scans/crawler";
import { uroFilter } from "@/features/scans/uroFilter";
import {
  matchCvesForTech,
  filterCveDuplicates,
} from "@/features/scans/cveMatch";
import { errorResponse, success } from "@/lib/api-response";

async function emitProgress(
  scanId: string,
  phase: string,
  message: string,
  percent: number,
  level: "info" | "warning" | "error" = "info",
) {
  const db = await getDB();
  await db
    .getRepository(ScanProgressEvent)
    .save({ scanId, phase, message, percent, level });
}

async function isCancelled(scanId: string): Promise<boolean> {
  const db = await getDB();
  const scan = await db
    .getRepository(Scan)
    .findOne({ where: { id: scanId }, select: ["cancelRequested"] });
  return scan?.cancelRequested || false;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireUser(request);
    if (!authed) return errorResponse("unauthenticated", "Please login first");
    if (authed.role === "superadmin")
      return errorResponse("forbidden", "Superadmin cannot run scans");

    const { id } = await params;
    const db = await getDB();
    const scan = await db.getRepository(Scan).findOne({ where: { id } });
    if (!scan) return errorResponse("not_found", "Scan not found");
    if (scan.userId !== authed.id)
      return errorResponse("forbidden", "Not your scan");
    if (scan.cancelRequested)
      return errorResponse("forbidden", "Scan was cancelled");

    const body = (await request.json()) as {
      selectedSubdomains?: string[];
      runAllDiscovered?: boolean;
      enableDnsLookup?: boolean;
      enableHttpProbe?: boolean;
      enableWebsiteTitleExtraction?: boolean;
      enablePortScan?: boolean;
      enableTechnologyDetection?: boolean;
      enableEndpointCrawler?: boolean;
      enableCveMatching?: boolean;
    };
    const { selectedSubdomains, runAllDiscovered } = body;

    const validation = validateRunSelectedBody({
      selectedSubdomains: selectedSubdomains || [],
      runAllDiscovered: runAllDiscovered ?? false,
      enableDnsLookup: body.enableDnsLookup ?? true,
      enableHttpProbe: body.enableHttpProbe ?? true,
      enableWebsiteTitleExtraction: body.enableWebsiteTitleExtraction ?? true,
      enablePortScan: body.enablePortScan ?? true,
      enableTechnologyDetection: body.enableTechnologyDetection ?? true,
      enableEndpointCrawler: body.enableEndpointCrawler ?? true,
      enableCveMatching: body.enableCveMatching ?? false,
    });
    if (!validation.ok) return errorResponse("validation", validation.message!);

    const userRole = authed.role;

    const { safe, warnings } = applyToggleDependencies(
      {
        enableDnsLookup: body.enableDnsLookup ?? true,
        enableHttpProbe: body.enableHttpProbe ?? true,
        enableWebsiteTitleExtraction: body.enableWebsiteTitleExtraction ?? true,
        enablePortScan: body.enablePortScan ?? true,
        enableTechnologyDetection: body.enableTechnologyDetection ?? true,
        enableEndpointCrawler: body.enableEndpointCrawler ?? true,
        enableCveMatching: body.enableCveMatching ?? false,
      },
      userRole,
    );

    await db.getRepository(Scan).update(id, {
      status: "running",
      enableDnsLookup: safe.enableDnsLookup,
      enableHttpProbe: safe.enableHttpProbe,
      enableWebsiteTitleExtraction: safe.enableWebsiteTitleExtraction,
      enablePortScan: safe.enablePortScan,
      enableTechnologyDetection: safe.enableTechnologyDetection,
      enableEndpointCrawler: safe.enableEndpointCrawler,
      enableCveMatching: safe.enableCveMatching,
    });

    await emitProgress(id, "modules", "Module options saved", 30);

    for (const w of warnings) {
      await emitProgress(id, "modules", w, 30, "warning");
    }

    const hrRepo = db.getRepository(HostResult);
    let selectedHosts: HostResult[];

    if (runAllDiscovered) {
      selectedHosts = await hrRepo.find({ where: { scanId: id } });
    } else {
      const normalized: string[] = [
        ...new Set(
          (selectedSubdomains || []).map((s: string) => s.trim().toLowerCase()),
        ),
      ].filter(Boolean);
      if (normalized.length === 0)
        return errorResponse("validation", "No valid subdomains selected");

      for (const host of normalized) {
        const exists = await hrRepo.findOne({
          where: { scanId: id, host } as any,
        });
        if (!exists) {
          return errorResponse(
            "validation",
            `Host "${host}" not found in scan`,
          );
        }
      }

      selectedHosts = await hrRepo.find({
        where: normalized.map((h) => ({ scanId: id, host: h }) as const),
      });
    }

    await emitProgress(
      id,
      "selected",
      `Running modules on ${selectedHosts.length} selected hosts`,
      35,
    );

    for (const h of selectedHosts) {
      await hrRepo.update(h.id, { selectedForScan: true });
    }
    await emitProgress(id, "selected", "Selected subdomains validated", 36);

    const domainHosts = selectedHosts.filter(
      (h) => h.detectedType === "domain" || h.detectedType === "subdomain",
    );

    if (safe.enableDnsLookup) {
      for (let i = 0; i < domainHosts.length; i++) {
        if (await isCancelled(id)) break;
        const h = domainHosts[i];
        try {
          const dnsR = await resolveDnsForHost(h.host);
          await hrRepo.update(h.id, {
            ipAddress: h.ipAddress || dnsR.ipAddress,
            aRecords: dnsR.aRecords,
            aaaaRecords: dnsR.aaaaRecords,
            cnameRecords: dnsR.cnameRecords,
            mxRecords: dnsR.mxRecords,
            nsRecords: dnsR.nsRecords,
            txtRecords: dnsR.txtRecords,
          });
        } catch {}
        if ((i + 1) % 5 === 0 || i + 1 === domainHosts.length) {
          await emitProgress(
            id,
            "dns",
            `DNS: ${i + 1}/${domainHosts.length}`,
            40,
          );
        }
      }
      await emitProgress(id, "dns", "DNS lookup completed", 45);
    } else {
      await emitProgress(
        id,
        "dns",
        "DNS helper skipped by user option",
        45,
        "warning",
      );
    }

    if (safe.enableHttpProbe) {
      for (let i = 0; i < domainHosts.length; i++) {
        if (await isCancelled(id)) break;
        const h = domainHosts[i];
        try {
          const probe = await probeHost(h.host);
          const updates: Record<string, unknown> = {
            statusCode: probe.statusCode,
            serverHeader: probe.serverHeader,
            poweredByHeader: probe.poweredByHeader,
            finalUrl: probe.finalUrl,
          };
          if (safe.enableWebsiteTitleExtraction && probe.pageTitle) {
            updates.pageTitle = probe.pageTitle;
          }
          await hrRepo.update(h.id, updates);
        } catch {}
        if ((i + 1) % 5 === 0 || i + 1 === domainHosts.length) {
          await emitProgress(
            id,
            "probe",
            `Probe: ${i + 1}/${domainHosts.length}`,
            50,
          );
        }
      }
      await emitProgress(id, "probe", "Probing completed", 55);

      if (!safe.enableWebsiteTitleExtraction) {
        await emitProgress(
          id,
          "probe",
          "Website title extraction skipped by user option",
          55,
          "warning",
        );
      }
    } else {
      await emitProgress(
        id,
        "probe",
        "HTTP probe skipped by user option",
        55,
        "warning",
      );
    }

    if (safe.enablePortScan) {
      const pp = userRole === "regular" ? "top100" : scan.portProfile;
      let count = 0;
      for (const h of selectedHosts) {
        if (await isCancelled(id)) break;
        count++;
        const ip = h.ipAddress;
        if (ip) {
          try {
            const ports = await portScan(ip, pp as any);
            if (ports.length > 0) {
              await hrRepo.update(h.id, { openPorts: ports as any });
            }
          } catch {}
        }
        if (count % 3 === 0) {
          await emitProgress(
            id,
            "port_scan",
            `Port scan: ${count}/${selectedHosts.length}`,
            60,
          );
        }
      }
      await emitProgress(id, "port_scan", "Port scan completed", 65);
    } else {
      await emitProgress(
        id,
        "port_scan",
        "Port scan skipped by user option",
        65,
        "warning",
      );
    }

    if (safe.enableTechnologyDetection) {
      const techRepo = db.getRepository(TechFingerprint);
      for (const h of domainHosts) {
        if (await isCancelled(id)) break;
        try {
          const probeData = {
            isAlive: !!h.statusCode,
            statusCode: h.statusCode,
            finalUrl: h.finalUrl,
            serverHeader: h.serverHeader,
            poweredByHeader: h.poweredByHeader,
            bodySnippet: null,
            pageTitle: h.pageTitle,
            responseTimeMs: null,
          };
          const manual = detectManualTech(probeData);
          let wapp = [] as any[];
          try {
            wapp = (await wappalyzerFingerprint(probeData)).map((t) => ({
              name: t.name,
              version: t.version,
              cpeProduct: null,
              categories: [],
              confidence: t.confidence ?? 100,
              icon: null,
              website: null,
              description: null,
              implies: [],
              source: "wappalyzer" as const,
            }));
          } catch {}
          const merged = mergeTechResults(manual, wapp);
          for (const tech of merged) {
            await techRepo.save(
              techRepo.create({
                hostResultId: h.id,
                name: tech.name,
                version: tech.version,
                source: tech.source,
                confidence: tech.confidence,
              }),
            );
          }
          const waf = detectWaf(
            merged.map((t) => t.name),
            h.serverHeader,
          );
          if (waf) await hrRepo.update(h.id, { wafName: waf });
        } catch {}
      }
      await emitProgress(id, "tech", "Technology detection completed", 75);

      const limit = await resolveLimit(authed.id, userRole);
      if (
        safe.enableCveMatching &&
        limit.cveEnabled &&
        userRole === "enterprise"
      ) {
        const allTechs = await techRepo.find({
          where: domainHosts.map((hd) => ({ hostResultId: hd.id }) as const),
        });
        for (const tech of allTechs) {
          if (await isCancelled(id)) break;
          try {
            const cves = await matchCvesForTech(
              {
                name: tech.name,
                version: tech.version,
                source: tech.source as any,
                confidence: tech.confidence,
              },
              tech.hostResultId,
              tech.id,
            );
            for (const cve of filterCveDuplicates(cves)) {
              await db.getRepository(CveMatch).save({
                hostResultId: tech.hostResultId,
                techFingerprintId: cve.techFingerprintId || (null as any),
                cveId: cve.cveId,
                severity: cve.severity,
                score: cve.score,
                summary: cve.summary,
              });
            }
          } catch {}
          await delay(1500);
        }
        await emitProgress(id, "cve", "CVE matching completed", 85);
      } else if (safe.enableCveMatching && userRole === "regular") {
        await emitProgress(
          id,
          "cve",
          "CVE matching blocked for Regular user",
          85,
          "warning",
        );
      } else {
        await emitProgress(id, "cve", "CVE matching skipped", 85, "warning");
      }
    } else {
      await emitProgress(
        id,
        "tech",
        "Technology detection skipped by user option",
        75,
        "warning",
      );
    }

    if (safe.enableEndpointCrawler && safe.enableHttpProbe) {
      const epRepo = db.getRepository(Endpoint);
      for (const h of domainHosts) {
        if (await isCancelled(id)) break;
        try {
          const url = h.finalUrl || `http://${h.host}`;
          const crawled = await crawler(url, Math.min(scan.crawlDepth, 2));
          const { kept } = uroFilter(crawled.map((c) => c.url));
          for (const k of kept) {
            await epRepo.save(
              epRepo.create({
                hostResultId: h.id,
                url: k.url,
                path: k.path,
                method: "GET",
                depth: 1,
                keptByUro: true,
              }),
            );
          }
        } catch {}
      }
      await emitProgress(id, "crawl", "Endpoint crawler completed", 92);
    } else if (!safe.enableEndpointCrawler) {
      await emitProgress(
        id,
        "crawl",
        "Endpoint crawler skipped by user option",
        92,
        "warning",
      );
    }

    for (const h of selectedHosts) {
      await hrRepo.update(h.id, {
        selectedScanCompleted: true,
        selectedScanCompletedAt: new Date(),
      });
    }

    await db
      .getRepository(Scan)
      .update(id, { status: "completed", finishedAt: new Date() });
    await emitProgress(id, "done", "Selected subdomain scan completed", 100);

    return success({ message: "Scan completed", scanId: id });
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
