import axios from "axios";
import { extractPageTitle } from "./titleExtractor";

export interface ProbeData {
  isAlive: boolean;
  statusCode: number | null;
  finalUrl: string | null;
  responseTimeMs: number | null;
  pageTitle: string | null;
  serverHeader: string | null;
  poweredByHeader: string | null;
  bodySnippet: string | null;
}

export async function probeHost(host: string): Promise<ProbeData> {
  for (const scheme of ["https", "http"]) {
    const t0 = Date.now();
    try {
      const r = await axios.get(`${scheme}://${host}`, {
        timeout: 8000,
        maxRedirects: 3,
        validateStatus: () => true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReconForge/1.0",
        },
      });
      const html = String(r.data || "").slice(0, 4000);
      const title = extractPageTitle(html);
      return {
        isAlive: r.status > 0,
        statusCode: r.status,
        finalUrl: r.request?.res?.responseUrl || `${scheme}://${host}`,
        responseTimeMs: Date.now() - t0,
        pageTitle: title,
        serverHeader: (r.headers["server"] as string) || null,
        poweredByHeader: (r.headers["x-powered-by"] as string) || null,
        bodySnippet: html,
      };
    } catch {}
  }
  return {
    isAlive: false,
    statusCode: null,
    finalUrl: null,
    responseTimeMs: null,
    pageTitle: null,
    serverHeader: null,
    poweredByHeader: null,
    bodySnippet: null,
  };
}
