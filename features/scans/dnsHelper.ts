import { promises as dns } from "node:dns";

export interface DnsResult {
  ipAddress: string | null;
  aRecords: string[];
  aaaaRecords: string[];
  cnameRecords: string[];
  mxRecords: string[];
  nsRecords: string[];
  txtRecords: string[];
}

async function safeResolve<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function resolveDnsForHost(host: string): Promise<DnsResult> {
  const [a, aaaa, cname, mx, ns, txt] = await Promise.all([
    safeResolve(() => dns.resolve4(host)),
    safeResolve(() => dns.resolve6(host)),
    safeResolve(() => dns.resolveCname(host)),
    safeResolve(() => dns.resolveMx(host)),
    safeResolve(() => dns.resolveNs(host)),
    safeResolve(() => dns.resolveTxt(host)),
  ]);

  const mxRecords = (mx || [])
    .sort((a, b) => a.priority - b.priority)
    .map((r) => `${r.exchange} (pri ${r.priority})`);
  const txtRecords = (txt || []).map((r) =>
    Array.isArray(r) ? r.join("") : String(r),
  );

  return {
    ipAddress: a && a.length ? a[0] : null,
    aRecords: a || [],
    aaaaRecords: aaaa || [],
    cnameRecords: cname || [],
    mxRecords,
    nsRecords: ns || [],
    txtRecords,
  };
}
