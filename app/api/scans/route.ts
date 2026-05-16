import { NextRequest } from "next/server";
import { getDB } from "@/lib/db";
import { Scan } from "@/entities/Scan";
import { Target } from "@/entities/Target";
import { HostResult } from "@/entities/HostResult";
import { ScanProgressEvent } from "@/entities/ScanProgressEvent";
import { requireUser } from "@/features/auth/requireUser";
import {
  resolveLimit,
  getDailyScanUsage,
  checkAndConsume,
} from "@/features/credits/creditService";
import { validateScanInput } from "@/features/scans/scanValidation";
import {
  extractTitle,
  detectTargetType,
} from "@/features/scans/titleExtractor";
import { ipThcLookup, dedupeIntelRows } from "@/features/scans/ipThcLookup";
import { resolveDnsForHost } from "@/features/scans/dnsHelper";
import { probeHost } from "@/features/scans/probe";
import { portScan } from "@/features/scans/portScan";
import {
  detectManualTech,
  wappalyzerFingerprint,
  mergeTechResults,
  detectWaf,
} from "@/features/scans/techDetect";
import { crawler } from "@/features/scans/crawler";
import { uroFilter } from "@/features/scans/uroFilter";
import { TechFingerprint } from "@/entities/TechFingerprint";
import { Endpoint } from "@/entities/Endpoint";
import { errorResponse, success } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed) {
      return errorResponse("unauthenticated", "Please login first");
    }
    const db = await getDB();
    const scans = await db.getRepository(Scan).find({
      where: { userId: authed.id },
      order: { createdAt: "DESC" },
    });
    return success(scans);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}

async function saveOriginalHosts(
  scanId: string,
  targets: { type: string; value: string; source: string }[],
) {
  const db = await getDB();
  const repo = db.getRepository(HostResult);

  for (const t of targets) {
    const title = extractTitle(t.value);
    await repo.save(
      repo.create({
        scanId,
        host: t.value,
        displayTitle: title.displayTitle,
        detectedType: title.detectedType,
        rootDomain: title.rootDomain,
        source: t.source,
      }),
    );
  }
}

async function runSubdomainDiscovery(
  scanId: string,
  rootDomain: string | null,
) {
  const db = await getDB();
  const hrRepo = db.getRepository(HostResult);

  let existingRows: HostResult[] = [];
  if (rootDomain) {
    existingRows = await hrRepo.find({ where: { rootDomain } });
  }

  const existingHosts = new Set(existingRows.map((r) => r.host.toLowerCase()));

  for (const row of existingRows) {
    if (!existingHosts.has(row.host.toLowerCase())) continue;
    const alreadyInScan = await hrRepo.findOne({
      where: { scanId, host: row.host },
    });
    if (!alreadyInScan) {
      const title = extractTitle(row.host);
      await hrRepo.save(
        hrRepo.create({
          scanId,
          host: row.host,
          displayTitle: title.displayTitle,
          detectedType: title.detectedType,
          rootDomain: title.rootDomain,
          source: "existing_db",
        }),
      );
    }
  }

  await db.getRepository(ScanProgressEvent).save({
    scanId,
    phase: "discovery",
    message: `Loaded ${existingRows.length} existing subdomains from database`,
    percent: 12,
    level: "info",
  });

  return existingRows.length;
}

async function runIpthcDiscovery(
  scanId: string,
  targets: { type: string; value: string }[],
) {
  const db = await getDB();
  const hrRepo = db.getRepository(HostResult);

  const allIntel: any[] = [];

  for (const t of targets) {
    const kind =
      t.type === "domain"
        ? "domain"
        : t.type === "subdomain"
          ? "subdomain"
          : t.type === "ip"
            ? "ip"
            : "cidr";
    try {
      const rows = await ipThcLookup({ kind: kind as any, value: t.value });
      allIntel.push(...rows);
    } catch {}
  }

  const deduped = dedupeIntelRows(allIntel);

  for (const row of deduped) {
    const title = extractTitle(row.subdomain);
    const exists = await hrRepo.findOne({
      where: { scanId, host: row.subdomain },
    });
    if (!exists) {
      await hrRepo.save(
        hrRepo.create({
          scanId,
          host: row.subdomain,
          displayTitle: title.displayTitle,
          detectedType: title.detectedType,
          rootDomain: title.rootDomain,
          source: "ipthc",
          ipAddress: row.ipAddress || null,
        }),
      );
    }
  }

  await db.getRepository(ScanProgressEvent).save({
    scanId,
    phase: "discovery",
    message: `IPTHC discovered ${deduped.length} unique subdomains`,
    percent: 20,
    level: "info",
  });

  return deduped.length;
}

export async function POST(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed) {
      return errorResponse("unauthenticated", "Please login first");
    }
    if (authed.role === "superadmin") {
      return errorResponse("forbidden", "Superadmin cannot create scans");
    }

    const body = await request.json();
    const {
      inputMode,
      targetValue,
      inputType,
      portProfile,
      enableSubdomainDiscovery,
      enableIpThcLookup,
      discoverOnly,
      enableDnsLookup,
      enableHttpProbe,
      enableWebsiteTitleExtraction,
      enablePortScan,
      enableTechnologyDetection,
      enableEndpointCrawler,
      enableCveMatching,
      crawlDepth,
    } = body;

    const limit = await resolveLimit(authed.id, authed.role);
    const validation = validateScanInput(
      {
        inputMode,
        targetValue,
        inputType: inputType || "mixed",
        portProfile: portProfile || "top100",
        enableSubdomainDiscovery: enableSubdomainDiscovery ?? true,
        enableIpThcLookup: enableIpThcLookup ?? true,
        enableDnsLookup: enableDnsLookup ?? true,
        enableHttpProbe: enableHttpProbe ?? true,
        enableWebsiteTitleExtraction: enableWebsiteTitleExtraction ?? true,
        enablePortScan: enablePortScan ?? true,
        enableTechnologyDetection: enableTechnologyDetection ?? true,
        enableEndpointCrawler: enableEndpointCrawler ?? true,
        enableCveMatching: enableCveMatching ?? false,
        crawlDepth: crawlDepth || 1,
      },
      authed.role,
      limit,
    );

    if (!validation.ok) {
      return errorResponse("validation", validation.message!);
    }

    const dailyScanUsed = await getDailyScanUsage(authed.id);
    if (dailyScanUsed >= limit.dailyScanLimit) {
      return errorResponse("credit_limit", "Daily scan limit reached");
    }

    const db = await getDB();
    const scanRepo = db.getRepository(Scan);
    const targetRepo = db.getRepository(Target);
    const hrRepo = db.getRepository(HostResult);
    const techRepo = db.getRepository(TechFingerprint);
    const epRepo = db.getRepository(Endpoint);
    const scan = scanRepo.create({
      userId: authed.id,
      name: body.name || null,
      inputMode,
      inputType: inputType || "mixed",
      targetValue,
      status: "running",
      portProfile: portProfile || "top100",
      crawlDepth: crawlDepth || 1,
      enableSubdomainDiscovery: enableSubdomainDiscovery ?? true,
      enableIpThcLookup: enableIpThcLookup ?? true,
      enableDnsLookup: enableDnsLookup ?? true,
      enableHttpProbe: enableHttpProbe ?? true,
      enableWebsiteTitleExtraction: enableWebsiteTitleExtraction ?? true,
      enablePortScan: enablePortScan ?? true,
      enableTechnologyDetection: enableTechnologyDetection ?? true,
      enableEndpointCrawler: enableEndpointCrawler ?? true,
      enableCveMatching: enableCveMatching ?? false,
      cveEnabled: limit.cveEnabled,
      startedAt: new Date(),
    });

    const savedScan = await scanRepo.save(scan);

    await db.getRepository(ScanProgressEvent).save({
      scanId: savedScan.id,
      phase: "init",
      message: "Scan started",
      percent: 0,
      level: "info",
    });

    const lines = targetValue
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);
    const savedTargets: { type: string; value: string; source: string }[] = [];

    for (const line of lines) {
      const type = detectTargetType(line);
      if (!type) continue;
      if (
        authed.role === "regular" &&
        (type === "ip" || type === "cidr_result")
      )
        continue;

      const source = inputMode === "txt_upload" ? "txt_upload" : "manual";
      await targetRepo.save(
        targetRepo.create({
          scanId: savedScan.id,
          type: type === "cidr_result" ? "cidr" : type,
          value: line,
          source,
        }),
      );
      savedTargets.push({ type, value: line, source });
    }

    await db.getRepository(ScanProgressEvent).save({
      scanId: savedScan.id,
      phase: "targets",
      message: `Parsed ${savedTargets.length} targets`,
      percent: 5,
      level: "info",
    });

    await saveOriginalHosts(savedScan.id, savedTargets);

    let discoveryCount = 0;

    if (enableSubdomainDiscovery ?? true) {
      const domains = savedTargets.filter(
        (t) => t.type === "domain" || t.type === "subdomain",
      );
      let rootDomain: string | null = null;
      if (domains.length > 0) {
        const title = extractTitle(domains[0].value);
        rootDomain = title.rootDomain || domains[0].value;
      }

      const dbCount = await runSubdomainDiscovery(savedScan.id, rootDomain);

      if (enableIpThcLookup ?? true) {
        const eligibleTargets = savedTargets.filter((t) => {
          if (authed.role === "regular")
            return t.type === "domain" || t.type === "subdomain";
          return true;
        });
        if (eligibleTargets.length > 0) {
          const ipthcCount = await runIpthcDiscovery(
            savedScan.id,
            eligibleTargets,
          );
          discoveryCount = dbCount + ipthcCount;
        } else {
          discoveryCount = dbCount;
        }
      } else {
        discoveryCount = dbCount;
      }
    }

    await db.getRepository(ScanProgressEvent).save({
      scanId: savedScan.id,
      phase: "discovery",
      message: `Subdomain discovery completed (${discoveryCount} total)`,
      percent: 25,
      level: "info",
    });

    await checkAndConsume(authed.id, "scan", savedScan.id);

    if (discoverOnly) {
      await scanRepo.update(savedScan.id, {
        status: "completed",
        finishedAt: new Date(),
      });
      await db.getRepository(ScanProgressEvent).save({
        scanId: savedScan.id,
        phase: "done",
        message: "Discovery scan completed",
        percent: 100,
        level: "info",
      });
    } else {
      await db.getRepository(ScanProgressEvent).save({
        scanId: savedScan.id,
        phase: "selected",
        message: "Auto-running Phase 2 on all discovered subdomains",
        percent: 30,
        level: "info",
      });

      const discoveredHosts = await db.getRepository(HostResult).find({
        where: { scanId: savedScan.id },
        order: { createdAt: "ASC" },
      });

      const selectedHosts = discoveredHosts.filter(
        (h) => h.detectedType === "domain" || h.detectedType === "subdomain",
      );

      if (selectedHosts.length > 0) {
        for (const h of selectedHosts) {
          await hrRepo.update(h.id, { selectedForScan: true });
        }

        for (const h of selectedHosts) {
          if (enableDnsLookup ?? true) {
            try {
              const dnsResult = await resolveDnsForHost(h.host);
              if (dnsResult.ipAddress && !h.ipAddress) {
                await hrRepo.update(h.id, {
                  ipAddress: dnsResult.ipAddress,
                  aRecords: dnsResult.aRecords,
                  aaaaRecords: dnsResult.aaaaRecords,
                  cnameRecords: dnsResult.cnameRecords,
                  mxRecords: dnsResult.mxRecords,
                  nsRecords: dnsResult.nsRecords,
                  txtRecords: dnsResult.txtRecords,
                });
              }
            } catch {}
          }
          await db.getRepository(ScanProgressEvent).save({
            scanId: savedScan.id,
            phase: "dns",
            message: enableDnsLookup
              ? `DNS resolved for ${h.host}`
              : "DNS helper skipped",
            percent: 40,
            level: enableDnsLookup ? "info" : "warning",
          });

          if (enableHttpProbe ?? true) {
            try {
              const probeResult = await probeHost(h.host);
              if (probeResult.isAlive) {
                const updates: Record<string, unknown> = {
                  statusCode: probeResult.statusCode,
                  serverHeader: probeResult.serverHeader,
                  poweredByHeader: probeResult.poweredByHeader,
                  finalUrl: probeResult.finalUrl,
                };
                if (enableWebsiteTitleExtraction && probeResult.pageTitle) {
                  updates.pageTitle = probeResult.pageTitle;
                }
                await hrRepo.update(h.id, updates);
              }
            } catch {}
          }
          await db.getRepository(ScanProgressEvent).save({
            scanId: savedScan.id,
            phase: "probe",
            message: enableHttpProbe
              ? `Probed ${h.host}`
              : "HTTP probe skipped",
            percent: 50,
            level: enableHttpProbe ? "info" : "warning",
          });

          if (enablePortScan && h.ipAddress) {
            try {
              const portProfile =
                authed.role === "regular" ? "top100" : "top100";
              const openPorts = await portScan(
                h.ipAddress,
                portProfile as any,
              );
              if (openPorts.length > 0) {
                await hrRepo.update(h.id, {
                  openPorts: openPorts as any,
                });
              }
            } catch {}
          }

          if (enableTechnologyDetection) {
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
              let wapa: any[] = [];
              try {
                wapa = await wappalyzerFingerprint(probeData);
              } catch {}
              const merged = mergeTechResults(
                manual,
                wapa.map((t: any) => ({
                  name: t.name,
                  version: t.version,
                  cpeProduct: null,
                  categories: [],
                  confidence: t.confidence ?? 100,
                  icon: null,
                  website: null,
                  description: null,
                  implies: [],
                  source: t.source,
                })),
              );
              const wafName = detectWaf(
                merged.map((t: any) => t.name),
                h.serverHeader,
              );
              if (wafName) {
                await hrRepo.update(h.id, { wafName });
              }
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
            } catch {}
          }

          if (enableEndpointCrawler && enableHttpProbe) {
            try {
              const url =
                h.finalUrl ||
                (h.ipAddress
                  ? `http://${h.ipAddress}`
                  : `http://${h.host}`);
              const crawled = await crawler(url, 1);
              const { kept } = uroFilter(crawled.map((c: any) => c.url));
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

          await hrRepo.update(h.id, {
            selectedScanCompleted: true,
            selectedScanCompletedAt: new Date(),
          });
        }
      }

      await scanRepo.update(savedScan.id, {
        status: "completed",
        finishedAt: new Date(),
      });
      await db.getRepository(ScanProgressEvent).save({
        scanId: savedScan.id,
        phase: "done",
        message: "Scan completed",
        percent: 100,
        level: "info",
      });
    }

    const discoveredHosts = await db.getRepository(HostResult).find({
      where: { scanId: savedScan.id },
      order: { detectedType: "ASC", host: "ASC" },
    });

    return success(
      {
        scan: savedScan,
        discoveredSubdomains: discoveredHosts.map((h) => ({
          id: h.id,
          host: h.host,
          displayTitle: h.displayTitle,
          detectedType: h.detectedType,
          rootDomain: h.rootDomain,
          source: h.source,
        })),
        discoveryCount,
      },
      201,
    );
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
