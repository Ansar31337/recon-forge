const CVE_TIMEOUT = Number(process.env.CVE_TIMEOUT_MS || 20000);

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

import axios from "axios";
import type { DetectedTech } from "./techDetect";

export interface CveEntry {
  cveId: string;
  severity: string;
  score: number | null;
  summary: string;
  techFingerprintId: string | null;
}

export async function matchCvesForTech(
  tech: DetectedTech,
  _hostResultId: string,
  techFingerprintId: string | null,
): Promise<CveEntry[]> {
  const name = tech.name?.trim();
  if (!name || name.length < 2) return [];

  const shortName = name
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!shortName || shortName.length < 2) return [];

  try {
    let keyword = shortName;
    if (tech.version?.trim()) {
      const ver = tech.version.trim().replace(/[^0-9.]/g, "");
      if (ver) keyword += ` ${ver}`;
    }
    const query = encodeURIComponent(keyword);
    const { data } = await axios.get(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${query}&resultsPerPage=15`,
      {
        timeout: CVE_TIMEOUT,
        headers: { Accept: "application/json" },
      },
    );

    if (!data?.vulnerabilities) return [];

    const techLower = name.toLowerCase();
    const searchWords = techLower.split(/\s+/).filter((w) => w.length > 2);
    const results: CveEntry[] = [];

    for (const item of data.vulnerabilities) {
      const cve = item.cve;
      if (!cve) continue;

      const cveId = cve.id || "";
      const descriptions = cve.descriptions || [];
      const summary = descriptions
        .filter((d: { lang: string }) => d.lang === "en")
        .map((d: { value: string }) => d.value)
        .join(" ")
        .slice(0, 500);

      if (!summary) continue;

      const summaryLower = summary.toLowerCase();
      if (!summaryLower.includes(shortName)) continue;

      if (
        searchWords.length > 1 &&
        !searchWords.some((w) => summaryLower.includes(w))
      )
        continue;

      const metrics = cve.metrics || {};
      const cvssV31 = metrics.cvssMetricV31?.[0]?.cvssData;
      const cvssV30 = metrics.cvssMetricV30?.[0]?.cvssData;
      const cvssV2 = metrics.cvssMetricV2?.[0]?.cvssData;
      const scoreData = cvssV31 || cvssV30 || cvssV2;

      const score = scoreData?.baseScore ?? null;
      const baseSeverity = scoreData?.baseSeverity ?? null;
      let severity = "medium";
      if (score != null) {
        if (score >= 9.0) severity = "critical";
        else if (score >= 7.0) severity = "high";
        else if (score >= 4.0) severity = "medium";
        else severity = "low";
      } else if (baseSeverity) {
        severity = String(baseSeverity).toLowerCase();
      }

      results.push({ cveId, severity, score, summary, techFingerprintId });

      if (results.length >= 10) break;
    }

    return results;
  } catch {
    return [];
  }
}

export function filterCveDuplicates(cves: CveEntry[]): CveEntry[] {
  const seen = new Set<string>();
  return cves.filter((c) => {
    const key = c.cveId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
