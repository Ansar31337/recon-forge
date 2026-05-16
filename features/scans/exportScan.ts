import type { Scan } from "@/entities/Scan";
import type { HostResult } from "@/entities/HostResult";
import type { TechFingerprint } from "@/entities/TechFingerprint";
import type { Endpoint } from "@/entities/Endpoint";
import type { CveMatch } from "@/entities/CveMatch";
import { csvEscape } from "@/lib/utils";

export type ExportSection =
  | "hosts"
  | "selectedHosts"
  | "endpoints"
  | "tech"
  | "ports"
  | "dns"
  | "waf"
  | "cve"
  | "progress";

export function generateJsonExport(
  scan: Scan,
  hosts: HostResult[],
  selectedHosts: HostResult[],
  techs: TechFingerprint[],
  endpoints: Endpoint[],
  cves: CveMatch[],
  sections: ExportSection[],
): string {
  const data: Record<string, unknown> = {};

  if (sections.includes("hosts") || sections.length === 0) {
    data.scan = {
      id: scan.id,
      targetValue: scan.targetValue,
      inputType: scan.inputType,
      inputMode: scan.inputMode,
      status: scan.status,
      portProfile: scan.portProfile,
      crawlDepth: scan.crawlDepth,
      createdAt: scan.createdAt,
      finishedAt: scan.finishedAt,
      scanModules: {
        enableSubdomainDiscovery: scan.enableSubdomainDiscovery,
        enableIpThcLookup: scan.enableIpThcLookup,
        enableDnsLookup: scan.enableDnsLookup,
        enableHttpProbe: scan.enableHttpProbe,
        enableWebsiteTitleExtraction: scan.enableWebsiteTitleExtraction,
        enablePortScan: scan.enablePortScan,
        enableTechnologyDetection: scan.enableTechnologyDetection,
        enableEndpointCrawler: scan.enableEndpointCrawler,
        enableCveMatching: scan.enableCveMatching,
      },
    };
  }

  if (sections.includes("hosts") || sections.length === 0) {
    data.hostResults = hosts.map((h) => ({
      host: h.host,
      displayTitle: h.displayTitle,
      pageTitle: h.pageTitle,
      detectedType: h.detectedType,
      rootDomain: h.rootDomain,
      ipAddress: h.ipAddress,
      cnameRecords: h.cnameRecords,
      aRecords: h.aRecords,
      aaaaRecords: h.aaaaRecords,
      mxRecords: h.mxRecords,
      nsRecords: h.nsRecords,
      statusCode: h.statusCode,
      serverHeader: h.serverHeader,
      wafName: h.wafName,
      source: h.source,
      openPorts: h.openPorts,
    }));
  }

  if (sections.includes("selectedHosts") && selectedHosts.length > 0) {
    data.selectedHostResults = selectedHosts.map((h) => ({
      host: h.host,
      displayTitle: h.displayTitle,
      pageTitle: h.pageTitle,
      detectedType: h.detectedType,
      rootDomain: h.rootDomain,
      ipAddress: h.ipAddress,
      cnameRecords: h.cnameRecords,
      aRecords: h.aRecords,
      aaaaRecords: h.aaaaRecords,
      mxRecords: h.mxRecords,
      nsRecords: h.nsRecords,
      statusCode: h.statusCode,
      serverHeader: h.serverHeader,
      wafName: h.wafName,
      source: h.source,
      openPorts: h.openPorts,
    }));
  }

  if (sections.includes("ports")) {
    data.openPorts = hosts
      .filter((h) => h.openPorts && (h.openPorts as unknown[]).length > 0)
      .map((h) => ({ host: h.host, port: h.openPorts }));
  }

  if (sections.includes("dns")) {
    data.dnsRecords = hosts.map((h) => ({
      host: h.host,
      aRecords: h.aRecords,
      aaaaRecords: h.aaaaRecords,
      cnameRecords: h.cnameRecords,
      mxRecords: h.mxRecords,
      nsRecords: h.nsRecords,
    }));
  }

  if (sections.includes("waf")) {
    data.waf = hosts
      .filter((h) => h.wafName)
      .map((h) => ({
        host: h.host,
        wafName: h.wafName,
        serverHeader: h.serverHeader,
      }));
  }

  if (sections.includes("tech") || sections.length === 0) {
    data.technologies = techs.map((t) => ({
      name: t.name,
      version: t.version,
      source: t.source,
      confidence: t.confidence,
    }));
  }

  if (sections.includes("endpoints") || sections.length === 0) {
    data.endpoints = endpoints.map((ep) => ({
      url: ep.url,
      path: ep.path,
      method: ep.method,
      statusCode: ep.statusCode,
      depth: ep.depth,
    }));
  }

  if ((sections.includes("cve") || sections.length === 0) && cves.length > 0) {
    data.cveMatches = cves.map((c) => ({
      cveId: c.cveId,
      severity: c.severity,
      score: c.score,
      summary: c.summary,
    }));
  }

  return JSON.stringify(data, null, 2);
}

export function generateCsvExport(
  hosts: HostResult[],
  cves: CveMatch[],
): string {
  const cveMap = new Map<string, string[]>();
  for (const c of cves) {
    const list = cveMap.get(c.hostResultId) || [];
    list.push(c.cveId);
    cveMap.set(c.hostResultId, list);
  }

  const hasCve = cves.length > 0;
  const headers = hasCve
    ? [
        "host",
        "displayTitle",
        "pageTitle",
        "detectedType",
        "ipAddress",
        "statusCode",
        "serverHeader",
        "wafName",
        "source",
        "cveIds",
      ]
    : [
        "host",
        "displayTitle",
        "pageTitle",
        "detectedType",
        "ipAddress",
        "statusCode",
        "serverHeader",
        "wafName",
        "source",
      ];

  const rows = hosts.map((h) => {
    const base = [
      csvEscape(h.host),
      csvEscape(h.displayTitle),
      csvEscape(h.pageTitle),
      csvEscape(h.detectedType),
      csvEscape(h.ipAddress),
      h.statusCode != null ? String(h.statusCode) : "",
      csvEscape(h.serverHeader),
      csvEscape(h.wafName),
      csvEscape(h.source),
    ];
    if (hasCve) {
      const ids = cveMap.get(h.id) || [];
      base.push(csvEscape(ids.join("; ")));
    }
    return base.join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function generateTxtExport(hosts: HostResult[]): string {
  return hosts
    .map((h) => {
      const parts = [h.host];
      if (h.detectedType) parts.push(`[${h.detectedType}]`);
      if (h.ipAddress) parts.push(`IP:${h.ipAddress}`);
      if (h.statusCode) parts.push(`HTTP:${h.statusCode}`);
      if (h.pageTitle) parts.push(`"${h.pageTitle}"`);
      return parts.join(" ");
    })
    .join("\n");
}
