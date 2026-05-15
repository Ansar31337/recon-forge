export type TargetKind = "domain" | "subdomain" | "ip" | "cidr";

export function parseTarget(
  raw: string,
): { kind: TargetKind; value: string } | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(s))
    return { kind: "cidr", value: s };
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) return { kind: "ip", value: s };
  if (/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(s)) {
    const parts = s.split(".");
    return { kind: parts.length > 2 ? "subdomain" : "domain", value: s };
  }
  return null;
}
