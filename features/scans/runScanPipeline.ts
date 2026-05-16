import { getDB } from "@/lib/db";
import { Scan } from "@/entities/Scan";
import { User } from "@/entities/User";
import { Target } from "@/entities/Target";
import { ScanProgressEvent } from "@/entities/ScanProgressEvent";
import { HostResult } from "@/entities/HostResult";
import { TechFingerprint } from "@/entities/TechFingerprint";
import { Endpoint } from "@/entities/Endpoint";
import { CveMatch } from "@/entities/CveMatch";
import { ipThcLookup, dedupeIntelRows, IntelRow } from "./ipThcLookup";
import { resolveDnsForHost } from "./dnsHelper";
import { probeHost } from "./probe";
import { portScan, OpenPort } from "./portScan";
import {
  detectManualTech,
  wappalyzerFingerprint,
  detectWaf,
  mergeTechResults,
} from "./techDetect";
import { crawler } from "./crawler";
import { uroFilter } from "./uroFilter";
import { matchCvesForTech, filterCveDuplicates } from "./cveMatch";
import { extractTitle } from "./titleExtractor";
import { resolveLimit } from "@/features/credits/creditService";

async function emitProgress(
  scanId: string,
  phase: string,
  message: string,
  percent: number,
  level: "info" | "warning" | "error" = "info",
) {
  const db = await getDB();
  await db.getRepository(ScanProgressEvent).save({
    scanId,
    phase,
    message,
    percent,
    level,
  });
}

async function isCancelled(scanId: string): Promise<boolean> {
  const db = await getDB();
  const scan = await db.getRepository(Scan).findOne({
    where: { id: scanId },
    select: ["cancelRequested"],
  });
  return scan?.cancelRequested || false;
}

async function saveHostResult(
  scanId: string,
  host: string,
  detectedType: string | null,
  displayTitle: string,
  rootDomain: string | null,
  source: string,
  intel?: IntelRow,
): Promise<HostResult> {
  const db = await getDB();
  const repo = db.getRepository(HostResult);

  const existing = await repo.findOne({
    where: { scanId, host, source },
  });

  if (existing) return existing;

  const result = repo.create({
    scanId,
    host,
    displayTitle,
    detectedType: detectedType as any,
    rootDomain,
    source,
    ipAddress: intel?.ipAddress || null,
    country: intel?.country || null,
    city: intel?.city || null,
    asn: intel?.asn || null,
    organization: intel?.organization || null,
    lastSeenOn: intel?.lastSeen || null,
  });

  return repo.save(result);
}

export async function runScanPipeline(scanId: string) {
  const db = await getDB();
  const scanRepo = db.getRepository(Scan);

  const scan = await scanRepo.findOne({
    where: { id: scanId },
  });

  if (!scan) return;

  const user = await db.getRepository(User).findOne({
    where: { id: scan.userId },
    select: ["id", "role"],
  });
  if (!user) return;

  const limit = await resolveLimit(scan.userId, user.role);
  const userRole = user.role;

  try {
    await scanRepo.update(scanId, { status: "running", startedAt: new Date() });
    await emitProgress(scanId, "init", "Scan started", 0);

    const targets = await db.getRepository(Target).find({
      where: { scanId },
    });

    if (targets.length === 0) {
      await emitProgress(scanId, "error", "No targets found", 100, "error");
      await scanRepo.update(scanId, {
        status: "failed",
        finishedAt: new Date(),
      });
      return;
    }

    await emitProgress(
      scanId,
      "targets",
      `Loaded ${targets.length} targets`,
      2,
    );

    const hostResults: HostResult[] = [];

    for (const target of targets) {
      if (await isCancelled(scanId)) throw new Error("cancelled");

      const title = extractTitle(target.value);
      const hr = await saveHostResult(
        scanId,
        target.value,
        title.detectedType,
        title.displayTitle,
        title.rootDomain,
        target.source,
      );
      hostResults.push(hr);
    }

    await emitProgress(
      scanId,
      "hosts",
      `Created ${hostResults.length} host entries`,
      5,
    );

    const allIntelRows: IntelRow[] = [];
    const enterpriseRole = userRole === "enterprise";

    for (const target of targets) {
      if (await isCancelled(scanId)) throw new Error("cancelled");

      const kind =
        target.type === "cidr"
          ? "cidr"
          : target.type === "ip"
            ? "ip"
            : target.type === "subdomain"
              ? "subdomain"
              : "domain";

      if (!enterpriseRole && (kind === "ip" || kind === "cidr")) {
        continue;
      }

      try {
        await emitProgress(
          scanId,
          "intel",
          `IPTHC lookup for ${target.value}`,
          8,
        );
        const rows = await ipThcLookup({ kind, value: target.value });
        allIntelRows.push(...rows);
      } catch {
        await emitProgress(
          scanId,
          "intel",
          `IPTHC failed for ${target.value}, continuing`,
          10,
          "warning",
        );
      }
    }

    const deduped = dedupeIntelRows(allIntelRows);

    for (const row of deduped) {
      if (await isCancelled(scanId)) throw new Error("cancelled");

      const title = extractTitle(row.subdomain);
      const source = row.tld ? "ipthc_reverse_ip" : "ipthc_subdomain";

      await saveHostResult(
        scanId,
        row.subdomain,
        title.detectedType,
        title.displayTitle,
        title.rootDomain,
        source,
        row,
      );
    }

    if (allIntelRows.length > 0) {
      await emitProgress(
        scanId,
        "intel",
        `Discovered ${deduped.length} unique hosts via IPTHC`,
        20,
      );
    } else {
      await emitProgress(scanId, "intel", "No IPTHC results", 20);
    }

    const allHosts = await db.getRepository(HostResult).find({
      where: { scanId },
    });

    if (scan.enableDnsLookup) {
      await emitProgress(scanId, "dns", "Resolving DNS records", 25);

      for (const host of allHosts) {
        if (await isCancelled(scanId)) throw new Error("cancelled");

        if (
          host.detectedType === "domain" ||
          host.detectedType === "subdomain"
        ) {
          try {
            const dnsResult = await resolveDnsForHost(host.host);
            if (dnsResult.ipAddress && !host.ipAddress) {
              await db.getRepository(HostResult).update(host.id, {
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
      }

      await emitProgress(scanId, "dns", "DNS resolution completed", 35);
    } else {
      await emitProgress(
        scanId,
        "dns",
        "DNS helper skipped by user option",
        35,
        "warning",
      );
    }

    if (scan.enableHttpProbe) {
      await emitProgress(scanId, "probe", "Probing hosts", 40);

      let probeCount = 0;
      const domainHosts = allHosts.filter(
        (h) => h.detectedType === "domain" || h.detectedType === "subdomain",
      );

      for (const host of domainHosts) {
        if (await isCancelled(scanId)) throw new Error("cancelled");
        probeCount++;

        try {
          const probeResult = await probeHost(host.host);
          if (probeResult.isAlive) {
            const updates: Record<string, unknown> = {
              statusCode: probeResult.statusCode,
              serverHeader: probeResult.serverHeader,
              poweredByHeader: probeResult.poweredByHeader,
              finalUrl: probeResult.finalUrl,
            };
            if (scan.enableWebsiteTitleExtraction && probeResult.pageTitle) {
              updates.pageTitle = probeResult.pageTitle;
            }
            await db.getRepository(HostResult).update(host.id, updates);
          }
        } catch {}

        if (probeCount % 5 === 0 || probeCount === domainHosts.length) {
          await emitProgress(
            scanId,
            "probe",
            `Probed ${probeCount}/${domainHosts.length} hosts`,
            45,
          );
        }
      }

      await emitProgress(scanId, "probe", "Probing completed", 50);

      if (!scan.enableWebsiteTitleExtraction) {
        await emitProgress(
          scanId,
          "probe",
          "Website title extraction skipped by user option",
          50,
          "warning",
        );
      }
    } else {
      await emitProgress(
        scanId,
        "probe",
        "HTTP/HTTPS probe skipped by user option",
        50,
        "warning",
      );
      if (!scan.enableWebsiteTitleExtraction) {
        await emitProgress(
          scanId,
          "probe",
          "Website title extraction skipped because HTTP/HTTPS probe is disabled",
          50,
          "warning",
        );
      }
    }

    const domainHostsForTech = allHosts.filter(
      (h) => h.detectedType === "domain" || h.detectedType === "subdomain",
    );

    if (scan.enableTechnologyDetection) {
      await emitProgress(scanId, "tech", "Detecting technologies", 55);

      const techResults: {
        hostResultId: string;
        name: string;
        version: string | null;
        source: "manual" | "wappalyzer";
        confidence: number | null;
      }[] = [];

      for (const host of domainHostsForTech) {
        if (await isCancelled(scanId)) throw new Error("cancelled");

        try {
          const probeData = {
            isAlive: !!host.statusCode,
            statusCode: host.statusCode,
            finalUrl: host.finalUrl,
            serverHeader: host.serverHeader,
            poweredByHeader: host.poweredByHeader,
            bodySnippet: null,
            pageTitle: host.pageTitle,
            responseTimeMs: null,
          };

          const manual = detectManualTech(probeData);

          let wappalyzer: {
            name: string;
            version: string | null;
            source: "wappalyzer";
            confidence: number | null;
          }[] = [];
          try {
            const wapTechs = await wappalyzerFingerprint(probeData);
            wappalyzer = wapTechs.map((t) => ({
              name: t.name,
              version: t.version,
              source: "wappalyzer" as const,
              confidence: t.confidence,
            }));
          } catch {}

          const merged = mergeTechResults(
            manual,
            wappalyzer.map((t) => ({
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

          for (const tech of merged) {
            if (
              !techResults.find(
                (t) =>
                  t.hostResultId === host.id &&
                  t.name === tech.name &&
                  t.version === tech.version,
              )
            ) {
              techResults.push({
                hostResultId: host.id,
                name: tech.name,
                version: tech.version,
                source: tech.source,
                confidence: tech.confidence,
              });
            }
          }

          const wafName = detectWaf(
            merged.map((t) => t.name),
            host.serverHeader,
          );
          if (wafName) {
            await db.getRepository(HostResult).update(host.id, { wafName });
          }
        } catch {}
      }

      const techRepo = db.getRepository(TechFingerprint);
      for (const t of techResults) {
        if (await isCancelled(scanId)) throw new Error("cancelled");
        await techRepo.save(
          techRepo.create({
            hostResultId: t.hostResultId,
            name: t.name,
            version: t.version,
            source: t.source,
            confidence: t.confidence,
          }),
        );
      }

      await emitProgress(
        scanId,
        "tech",
        `Detected ${techResults.length} technologies`,
        65,
      );
    } else {
      await emitProgress(
        scanId,
        "tech",
        "Technology detection skipped by user option",
        65,
        "warning",
      );
    }

    if (scan.enablePortScan) {
      await emitProgress(scanId, "port_scan", "Scanning ports", 70);

      const portProfile =
        userRole === "regular"
          ? "top100"
          : scan.portProfile === "top1000"
            ? "top1000"
            : "top100";

      let portCount = 0;
      for (const host of allHosts) {
        if (await isCancelled(scanId)) throw new Error("cancelled");
        portCount++;

        const ip = host.ipAddress;
        if (ip) {
          try {
            const openPorts = await portScan(ip, portProfile as any);
            if (openPorts.length > 0) {
              await db
                .getRepository(HostResult)
                .update(host.id, { openPorts: openPorts as any });
            }
          } catch {}
        }

        if (portCount % 5 === 0 || portCount === allHosts.length) {
          await emitProgress(
            scanId,
            "port_scan",
            `Scanned ${portCount}/${allHosts.length} hosts`,
            75,
          );
        }
      }

      await emitProgress(scanId, "port_scan", "Port scan completed", 80);
    } else {
      await emitProgress(
        scanId,
        "port_scan",
        "Port scan skipped by user option",
        80,
        "warning",
      );
    }

    if (scan.enableEndpointCrawler && scan.enableHttpProbe) {
      const crawlDepth = Math.min(scan.crawlDepth, limit.maxCrawlDepth);

      await emitProgress(scanId, "crawl", "Crawling endpoints", 85);

      for (const host of domainHostsForTech) {
        if (await isCancelled(scanId)) throw new Error("cancelled");

        const url =
          host.finalUrl ||
          (host.ipAddress ? `http://${host.ipAddress}` : `http://${host.host}`);

        try {
          await emitProgress(
            scanId,
            "crawl",
            `Endpoint crawler started for ${host.host}`,
            86,
          );
          const crawled = await crawler(url, crawlDepth);
          const { kept } = uroFilter(crawled.map((c) => c.url));

          await emitProgress(
            scanId,
            "crawl",
            `URO filter started for ${host.host}`,
            87,
          );

          const endpointRepo = db.getRepository(Endpoint);
          for (const k of kept) {
            await endpointRepo.save(
              endpointRepo.create({
                hostResultId: host.id,
                url: k.url,
                path: k.path,
                method: "GET",
                depth: 1,
                keptByUro: true,
              }),
            );
          }

          await emitProgress(
            scanId,
            "crawl",
            `Endpoint crawler completed for ${host.host}`,
            88,
          );
        } catch {
          await emitProgress(
            scanId,
            "crawl",
            `Endpoint crawler failed for ${host.host}, continuing`,
            88,
            "warning",
          );
        }
      }

      await emitProgress(scanId, "crawl", "Crawl completed", 92);
    } else if (!scan.enableEndpointCrawler) {
      await emitProgress(
        scanId,
        "crawl",
        "Endpoint crawler skipped by user option",
        92,
        "warning",
      );
    } else {
      await emitProgress(
        scanId,
        "crawl",
        "Endpoint crawler skipped because HTTP/HTTPS probe is disabled",
        92,
        "warning",
      );
    }

    if (scan.enableCveMatching && limit.cveEnabled && userRole !== "regular") {
      await emitProgress(scanId, "cve", "Matching CVEs", 94);

      const hostIds = allHosts.map((h) => h.id);

      const techRepo = db.getRepository(TechFingerprint);
      const allTechs = hostIds.length
        ? await techRepo.find({
            where: hostIds.map((hid) => ({ hostResultId: hid })),
          })
        : [];

      for (const tech of allTechs) {
        if (await isCancelled(scanId)) throw new Error("cancelled");

        try {
          const cveEntries = await matchCvesForTech(
            {
              name: tech.name,
              version: tech.version,
              source: tech.source as "manual" | "wappalyzer",
              confidence: tech.confidence,
            },
            tech.hostResultId,
            tech.id,
          );

          const deduped = filterCveDuplicates(cveEntries);

          for (const cve of deduped) {
            await db.getRepository(CveMatch).save({
              hostResultId: tech.hostResultId,
              techFingerprintId: cve.techFingerprintId || (null as any),
              cveId: cve.cveId,
              severity: cve.severity as any,
              score: cve.score,
              summary: cve.summary,
            });
          }
        } catch {}
      }

      await emitProgress(scanId, "cve", "CVE matching completed", 98);
    } else if (userRole === "regular") {
      await emitProgress(
        scanId,
        "cve",
        "CVE matching blocked for Regular user",
        98,
        "warning",
      );
    } else if (!scan.enableTechnologyDetection) {
      await emitProgress(
        scanId,
        "cve",
        "CVE matching skipped because Technology Detection is disabled",
        98,
        "warning",
      );
    } else {
      await emitProgress(scanId, "cve", "CVE matching skipped", 98, "warning");
    }

    await scanRepo.update(scanId, {
      status: "completed",
      finishedAt: new Date(),
    });
    await emitProgress(scanId, "done", "Pipeline completed successfully", 100);
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message === "cancelled") {
      await scanRepo.update(scanId, {
        status: "cancelled",
        finishedAt: new Date(),
      });
      await emitProgress(scanId, "cancelled", "Scan cancelled by user", 100);
    } else {
      console.error("Pipeline crash:", err);
      await scanRepo.update(scanId, {
        status: "failed",
        finishedAt: new Date(),
      });
      await emitProgress(
        scanId,
        "failed",
        `Pipeline error: ${err.message}`,
        100,
        "error",
      );
    }
  }
}
