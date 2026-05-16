export function generateDisplayTitle(
  host: string,
  detectedType: string | null,
): string {
  const parts = host.split(".");
  const domain = parts.slice(0, -2).join(".");
  const apex = parts.slice(-2).join(".");
  if (detectedType === "domain") return `${domain || apex} — ${host}`;
  if (detectedType === "subdomain" && domain) return `${domain} — ${host}`;
  return host;
}

export type DetectedType = "domain" | "subdomain" | "ip" | "cidr_result" | null;

export function detectTargetType(host: string): DetectedType | null {
  if (/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(host)) return "cidr_result";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return "ip";
  if (/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(host)) {
    const parts = host.split(".");
    return parts.length >= 3 ? "subdomain" : "domain";
  }
  return null;
}

export function extractRootDomain(host: string): string {
  const parts = host.split(".");
  if (parts.length < 2) return host;
  return parts.slice(-2).join(".");
}

export function extractTitle(host: string): {
  displayTitle: string;
  detectedType: string | null;
  rootDomain: string;
} {
  const detectedType = detectTargetType(host);
  return {
    displayTitle: generateDisplayTitle(host, detectedType),
    detectedType,
    rootDomain: extractRootDomain(host),
  };
}

export function extractPageTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return "";
  return match[1]
    .replace(/<[^>]+>/g, "")
    .trim()
    .slice(0, 500);
}
