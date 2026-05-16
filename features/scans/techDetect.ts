import type { ProbeData } from "./probe";
import techData from "../../public/wappalyzer-tech.json";

export interface VendorProduct {
  vendor: string;
  product: string;
  isCms?: boolean;
}

export interface TechRow {
  name: string;
  version: string | null;
  cpeProduct: string | null;
  categories: string[];
  confidence: number;
  icon: string | null;
  website: string | null;
  description: string | null;
  implies: string[];
}

export interface DetectedTech {
  name: string;
  version: string | null;
  source: "manual" | "wappalyzer";
  confidence: number | null;
}

const MANUAL_MAP: Record<string, VendorProduct> = {
  "next.js": { vendor: "vercel", product: "next.js" },
  react: { vendor: "facebook", product: "react" },
  "nuxt.js": { vendor: "nuxtjs", product: "nuxt" },
  "vue.js": { vendor: "vuejs", product: "vue" },
  angular: { vendor: "google", product: "angular" },
  "node.js": { vendor: "nodejs", product: "node.js" },
  express: { vendor: "expressjs", product: "express" },
  nestjs: { vendor: "nestjs", product: "nest" },
  wordpress: { vendor: "wordpress", product: "wordpress", isCms: true },
  drupal: { vendor: "drupal", product: "drupal", isCms: true },
  joomla: { vendor: "joomla", product: "joomla", isCms: true },
  magento: { vendor: "adobe", product: "magento", isCms: true },
  shopify: { vendor: "shopify", product: "shopify", isCms: true },
  ghost: { vendor: "ghost", product: "ghost", isCms: true },
  strapi: { vendor: "strapi", product: "strapi", isCms: true },
  nginx: { vendor: "nginx", product: "nginx" },
  apache: { vendor: "apache", product: "http_server" },
  iis: { vendor: "microsoft", product: "internet_information_services" },
  litespeed: { vendor: "litespeedtech", product: "litespeed" },
  php: { vendor: "php", product: "php" },
  python: { vendor: "python", product: "python" },
  ruby: { vendor: "ruby-lang", product: "ruby" },
  mysql: { vendor: "oracle", product: "mysql" },
  postgresql: { vendor: "postgresql", product: "postgresql" },
  cloudflare: { vendor: "cloudflare", product: "cloudflare" },
};

export function resolveVendorProduct(tech: {
  name: string;
  cpeProduct?: string | null;
  categories?: string[];
}): VendorProduct | null {
  const key = (tech.cpeProduct || tech.name || "").toLowerCase().trim();
  if (MANUAL_MAP[key]) return MANUAL_MAP[key];
  if (tech.categories?.some((c) => c.toLowerCase() === "cms")) {
    return { vendor: key, product: key, isCms: true };
  }
  return null;
}

const WAF_NAMES = new Set([
  "cloudflare",
  "akamai",
  "fastly",
  "sucuri",
  "imperva",
  "incapsula",
  "aws_waf",
  "barracuda",
  "f5",
]);

export function detectWaf(
  techNames: string[],
  serverHeader: string | null,
): string | null {
  for (const name of techNames) {
    if (WAF_NAMES.has(name.toLowerCase())) return name;
  }
  if (serverHeader) {
    const s = serverHeader.toLowerCase();
    if (s.includes("cloudflare")) return "Cloudflare";
    if (s.includes("akamai")) return "Akamai";
    if (s.includes("sucuri")) return "Sucuri";
    if (s.includes("imperva")) return "Imperva";
  }
  return null;
}

export function detectManualTech(probe: ProbeData): DetectedTech[] {
  const results: DetectedTech[] = [];
  const seen = new Set<string>();

  const server = probe.serverHeader;
  const poweredBy = probe.poweredByHeader;
  const html = probe.bodySnippet || "";

  const serverTechs: Record<string, string> = {
    nginx: "nginx",
    apache: "Apache",
    "microsoft-iis": "IIS",
    litespeed: "LiteSpeed",
    cloudflare: "Cloudflare",
    varnish: "Varnish",
    envoy: "Envoy",
  };

  if (server) {
    const s = server.toLowerCase();
    for (const [key, name] of Object.entries(serverTechs)) {
      if (s.includes(key)) {
        const v =
          server.match(new RegExp(`${key}[/ ]([0-9.]+)`, "i"))?.[1] || null;
        results.push({ name, version: v, source: "manual", confidence: 90 });
        seen.add(name.toLowerCase());
      }
    }
  }

  if (poweredBy) {
    const pb = poweredBy.toLowerCase();
    if (pb.includes("php")) {
      const v = poweredBy.match(/PHP\/([0-9.]+)/i)?.[1] || null;
      if (!seen.has("php")) {
        results.push({
          name: "PHP",
          version: v,
          source: "manual",
          confidence: 95,
        });
        seen.add("php");
      }
    }
    if (pb.includes("express")) {
      if (!seen.has("express")) {
        results.push({
          name: "Express",
          version: null,
          source: "manual",
          confidence: 80,
        });
        seen.add("express");
      }
    }
  }

  if (html.includes("_next/static")) {
    if (!seen.has("next.js")) {
      results.push({
        name: "Next.js",
        version: null,
        source: "manual",
        confidence: 85,
      });
      seen.add("next.js");
    }
  }
  if (html.includes("wp-content") || html.includes("wp-includes")) {
    if (!seen.has("wordpress")) {
      results.push({
        name: "WordPress",
        version: null,
        source: "manual",
        confidence: 85,
      });
      seen.add("wordpress");
    }
  }
  if (html.includes("__cf_bm") || html.includes("cf-ray")) {
    if (!seen.has("cloudflare")) {
      results.push({
        name: "Cloudflare",
        version: null,
        source: "manual",
        confidence: 90,
      });
      seen.add("cloudflare");
    }
  }
  if (html.includes("Drupal")) {
    if (!seen.has("drupal")) {
      results.push({
        name: "Drupal",
        version: null,
        source: "manual",
        confidence: 80,
      });
      seen.add("drupal");
    }
  }

  return results;
}

export async function wappalyzerFingerprint(
  probe: ProbeData,
): Promise<TechRow[]> {
  if (
    !probe.finalUrl &&
    !probe.bodySnippet &&
    !probe.serverHeader &&
    !probe.poweredByHeader
  ) {
    return [];
  }

  const results: TechRow[] = [];
  const html = probe.bodySnippet || "";
  const server = probe.serverHeader || "";
  const poweredBy = probe.poweredByHeader || "";

  for (const [name, tech] of Object.entries((techData as any).technologies)) {
    let matched = false;
    let version: string | null = null;

    if ((tech as any).html) {
      const re = new RegExp((tech as any).html, "i");
      if (re.test(html)) matched = true;
    }

    if ((tech as any).headers) {
      for (const [h, pattern] of Object.entries((tech as any).headers)) {
        const val =
          h === "server" ? server : h === "x-powered-by" ? poweredBy : "";
        if (val) {
          const re = new RegExp(pattern as string, "i");
          const m = re.exec(val);
          if (m) {
            matched = true;
            if (m[1]) version = m[1];
          }
        }
      }
    }

    if ((tech as any).meta?.generator) {
      const re = new RegExp(
        `<meta[^>]+content=["']${(tech as any).meta.generator}["']`,
        "i",
      );
      if (re.test(html)) matched = true;
    }

    if (matched) {
      const cats = ((tech as any).cats || []).map(
        (c: number) =>
          (techData as any).categories?.[c.toString()]?.name || "Other",
      );
      results.push({
        name,
        version,
        cpeProduct: null,
        categories: cats,
        confidence: 100,
        icon: null,
        website: (tech as any).website || null,
        description: null,
        implies: Array.isArray((tech as any).implies)
          ? (tech as any).implies
          : (tech as any).implies
            ? [(tech as any).implies]
            : [],
      });
    }
  }

  const impliesSet = new Set(results.flatMap((r) => r.implies));
  for (const name of impliesSet) {
    if (!results.find((r) => r.name === name)) {
      const tech = (techData as any).technologies?.[name];
      if (tech) {
        results.push({
          name,
          version: null,
          cpeProduct: null,
          categories: (tech.cats || []).map(
            (c: number) =>
              (techData as any).categories?.[c.toString()]?.name || "Other",
          ),
          confidence: 100,
          icon: null,
          website: tech.website || null,
          description: null,
          implies: [],
        });
      }
    }
  }

  return results;
}

export function mergeTechResults(
  manual: DetectedTech[],
  wappalyzer: TechRow[],
): DetectedTech[] {
  const merged = new Map<string, DetectedTech>();

  for (const t of manual) {
    merged.set(t.name.toLowerCase(), t);
  }

  for (const t of wappalyzer) {
    const key = t.name.toLowerCase();
    if (!merged.has(key)) {
      merged.set(key, {
        name: t.name,
        version: t.version,
        source: "wappalyzer",
        confidence: t.confidence,
      });
    }
  }

  return [...merged.values()];
}
