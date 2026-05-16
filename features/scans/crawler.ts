import axios from "axios";

export interface CrawledUrl {
  url: string;
  path: string;
  depth: number;
}

const LINK_RE = /<a[^>]+href=["']([^"']+)["']/gi;
const CRAWLER_TIMEOUT_MS = Number(process.env.CRAWLER_TIMEOUT_MS || 60000);
const REQUEST_TIMEOUT = 8000;

export async function crawler(
  rootUrl: string,
  maxDepth: number,
): Promise<CrawledUrl[]> {
  const seen = new Set<string>([rootUrl]);
  const queue: { url: string; depth: number }[] = [{ url: rootUrl, depth: 0 }];
  const out: CrawledUrl[] = [];
  const startedAt = Date.now();

  while (queue.length) {
    if (Date.now() - startedAt >= CRAWLER_TIMEOUT_MS) break;

    const { url, depth } = queue.shift()!;

    const remaining = CRAWLER_TIMEOUT_MS - (Date.now() - startedAt);
    if (remaining <= 0) break;

    try {
      const { data } = await axios.get(url, {
        timeout: Math.min(REQUEST_TIMEOUT, remaining),
        maxRedirects: 3,
        validateStatus: () => true,
        headers: { "User-Agent": "Mozilla/5.0 ReconForge/1.0" },
      });
      const u = new URL(url);
      out.push({ url, path: u.pathname, depth });

      if (depth >= maxDepth) continue;

      let m: RegExpExecArray | null;
      const html = String(data).slice(0, 200000);
      while ((m = LINK_RE.exec(html)) !== null) {
        if (Date.now() - startedAt >= CRAWLER_TIMEOUT_MS) break;
        try {
          const child = new URL(m[1], url).toString();
          if (!seen.has(child) && new URL(child).hostname === u.hostname) {
            seen.add(child);
            queue.push({ url: child, depth: depth + 1 });
          }
        } catch {}
      }
    } catch {}
  }
  return out;
}
