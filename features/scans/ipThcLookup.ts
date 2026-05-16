import axios from "axios";
import { cidrExpand } from "./cidrExpand";

const API = process.env.IPTHC_API_URL || "https://ip.thc.org/api/v1";
const LIMIT = Number(process.env.IPTHC_LIMIT || 50000);
const TIMEOUT = Number(process.env.IPTHC_TIMEOUT_MS || 8000);

export interface IntelRow {
  rootDomain: string;
  subdomain: string;
  ipAddress: string | null;
  lastSeen: string | null;
  country?: string;
  city?: string;
  asn?: string;
  organization?: string;
  tld?: string;
}

function splitDomain(fqdn: string): { rootDomain: string; subdomain: string } {
  const parts = fqdn.split(".");
  if (parts.length <= 2) return { rootDomain: fqdn, subdomain: fqdn };
  return { rootDomain: parts.slice(-2).join("."), subdomain: fqdn };
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function extractSubdomainsFromCsv(csvText: string): string[] {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  let subdomainIdx = -1;

  for (let i = 0; i < header.length; i++) {
    const h = header[i].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (h === "subdomain" || h === "subdomains") {
      subdomainIdx = i;
      break;
    }
  }

  if (subdomainIdx === -1) {
    for (let i = 0; i < header.length; i++) {
      const h = header[i].toLowerCase();
      if (h.includes("subdomain")) {
        subdomainIdx = i;
        break;
      }
    }
  }

  const out: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    let val: string | undefined;

    if (subdomainIdx >= 0 && subdomainIdx < fields.length) {
      val = fields[subdomainIdx];
    } else if (fields.length >= 2) {
      val = fields[1];
    } else if (fields.length >= 1) {
      val = fields[0];
    }

    if (val && val.length > 0) {
      const cleaned = val.trim();
      if (cleaned && !/^subdomain(s)?$/i.test(cleaned)) {
        out.push(cleaned);
      }
    }
  }
  return out;
}

export async function lookupByDomain(domain: string): Promise<IntelRow[]> {
  try {
    const { data } = await axios.get(`${API}/subdomains/download`, {
      params: { domain, limit: LIMIT },
      headers: { Accept: "text/csv,application/json,**" },
      timeout: TIMEOUT,
      responseType: "text",
    });

    const subdomains = extractSubdomainsFromCsv(String(data));
    return subdomains.map((sd) => {
      const { rootDomain, subdomain } = splitDomain(sd);
      return {
        rootDomain,
        subdomain,
        ipAddress: null,
        lastSeen: null,
      };
    });
  } catch {
    return [];
  }
}

export async function lookupByIp(ip: string): Promise<IntelRow[]> {
  try {
    const { data } = await axios.get(`${API}/download`, {
      params: { ip_address: ip, limit: LIMIT },
      headers: { Accept: "text/csv,application/json,*/*" },
      timeout: TIMEOUT,
      responseType: "text",
    });

    const subdomains = extractSubdomainsFromCsv(String(data));
    return subdomains.map((sd) => {
      const { rootDomain, subdomain } = splitDomain(sd);
      return { rootDomain, subdomain, ipAddress: ip, lastSeen: null };
    });
  } catch {
    return [];
  }
}

export async function lookupByCidr(cidr: string): Promise<IntelRow[]> {
  const ips = cidrExpand(cidr);
  const all: IntelRow[] = [];
  for (const ip of ips) {
    const results = await lookupByIp(ip);
    all.push(...results);
  }
  return all;
}

export async function ipThcLookup(target: {
  kind: "domain" | "subdomain" | "ip" | "cidr";
  value: string;
}): Promise<IntelRow[]> {
  if (process.env.IPTHC_DISABLED === "true") return [];
  try {
    if (target.kind === "domain" || target.kind === "subdomain")
      return await lookupByDomain(target.value);
    if (target.kind === "ip") return await lookupByIp(target.value);
    if (target.kind === "cidr") return await lookupByCidr(target.value);
  } catch (e) {
    console.warn("ipThcLookup failed:", (e as Error).message);
  }
  return [];
}

export function dedupeIntelRows(rows: IntelRow[]): IntelRow[] {
  const map = new Map<string, IntelRow>();
  for (const r of rows) {
    const k = `${r.rootDomain}|${r.subdomain}`;
    const existing = map.get(k);
    if (!existing || (!existing.ipAddress && r.ipAddress)) map.set(k, r);
  }
  return [...map.values()];
}
