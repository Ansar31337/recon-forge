const STATIC_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "ico",
  "css",
  "woff",
  "woff2",
  "ttf",
  "eot",
  "mp4",
  "mp3",
  "pdf",
]);
const JUNK_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
  "referrer",
]);
const ID_RE = /^([0-9]+|[a-f0-9]{8,}|[0-9a-f-]{32,36})$/i;

export type UroResult = {
  kept: { url: string; path: string; queryKeysSorted: string }[];
  dropped: string[];
};

export function uroFilter(urls: string[]): UroResult {
  const kept: UroResult["kept"] = [];
  const dropped: string[] = [];
  const seenSignatures = new Set<string>();

  for (const raw of urls) {
    try {
      const u = new URL(raw);
      u.hash = "";

      const ext = (u.pathname.split(".").pop() || "").toLowerCase();
      if (STATIC_EXT.has(ext)) {
        dropped.push(raw);
        continue;
      }

      const params = [...u.searchParams.entries()].filter(
        ([k]) => !JUNK_PARAMS.has(k.toLowerCase()),
      );
      params.forEach(([k]) => u.searchParams.delete(k));
      const keys = params
        .map(([k]) => k)
        .sort()
        .join(",");

      const pathNorm = u.pathname.replace(/\/+$/, "") || "/";
      const shape = pathNorm
        .split("/")
        .map((seg) => (ID_RE.test(seg) ? ":id" : seg))
        .join("/");

      const sig = `${u.hostname}|${shape}|${keys}`;
      if (seenSignatures.has(sig)) {
        dropped.push(raw);
        continue;
      }
      seenSignatures.add(sig);

      kept.push({
        url: u.toString().replace(/\?$/, ""),
        path: pathNorm,
        queryKeysSorted: keys,
      });
    } catch {
      dropped.push(raw);
    }
  }
  return { kept, dropped };
}
