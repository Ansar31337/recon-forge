export interface ScanInput {
  inputMode: "single" | "txt_upload";
  targetValue: string;
  inputType: string;
  portProfile: string;
  enableSubdomainDiscovery: boolean;
  enableIpThcLookup: boolean;
  enableDnsLookup: boolean;
  enableHttpProbe: boolean;
  enableWebsiteTitleExtraction: boolean;
  enablePortScan: boolean;
  enableTechnologyDetection: boolean;
  enableEndpointCrawler: boolean;
  enableCveMatching: boolean;
  crawlDepth: number;
}

export interface ScanValidationResult {
  ok: boolean;
  message?: string;
}

export interface ModuleToggles {
  enableDnsLookup: boolean;
  enableHttpProbe: boolean;
  enableWebsiteTitleExtraction: boolean;
  enablePortScan: boolean;
  enableTechnologyDetection: boolean;
  enableEndpointCrawler: boolean;
  enableCveMatching: boolean;
}

export function applyToggleDependencies(
  toggles: ModuleToggles,
  role: string,
): { safe: ModuleToggles; warnings: string[] } {
  const safe = { ...toggles };
  const warnings: string[] = [];

  if (!safe.enableHttpProbe) {
    if (safe.enableWebsiteTitleExtraction) {
      safe.enableWebsiteTitleExtraction = false;
      warnings.push(
        "Website title extraction disabled because HTTP probe is off",
      );
    }
    if (safe.enableEndpointCrawler) {
      safe.enableEndpointCrawler = false;
      warnings.push("Endpoint crawler disabled because HTTP probe is off");
    }
  }

  if (!safe.enableTechnologyDetection) {
    if (safe.enableCveMatching) {
      safe.enableCveMatching = false;
      warnings.push(
        "CVE matching disabled because technology detection is off",
      );
    }
  }

  if (role === "regular" && safe.enableCveMatching) {
    safe.enableCveMatching = false;
    warnings.push("CVE matching blocked for Regular user");
  }

  return { safe, warnings };
}

export function validateScanInput(
  input: ScanInput,
  role: string,
  limit: { dailyScanLimit: number; maxCrawlDepth: number; cveEnabled: boolean },
): ScanValidationResult {
  if (!input.inputMode || !input.targetValue) {
    return { ok: false, message: "Input mode and target value are required" };
  }

  if (!["single", "txt_upload"].includes(input.inputMode)) {
    return { ok: false, message: "Invalid input mode" };
  }

  const lines = input.targetValue
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { ok: false, message: "No valid targets found" };
  }

  if (role === "regular") {
    if (input.inputType === "ip" || input.inputType === "cidr") {
      return {
        ok: false,
        message: "Regular users cannot scan IP or CIDR targets",
      };
    }
    if (input.portProfile === "top1000") {
      return {
        ok: false,
        message: "Regular users cannot use top1000 port profile",
      };
    }
    if (input.enableCveMatching) {
      return { ok: false, message: "Regular users cannot enable CVE matching" };
    }
    if (input.crawlDepth > 2) {
      return { ok: false, message: "Regular users max crawl depth is 2" };
    }
  }

  if (role === "enterprise" && input.crawlDepth > limit.maxCrawlDepth) {
    return { ok: false, message: `Max crawl depth is ${limit.maxCrawlDepth}` };
  }

  return { ok: true };
}

export function validateRunSelectedBody(body: {
  selectedSubdomains: string[];
  runAllDiscovered: boolean;
  enableDnsLookup: boolean;
  enableHttpProbe: boolean;
  enableWebsiteTitleExtraction: boolean;
  enablePortScan: boolean;
  enableTechnologyDetection: boolean;
  enableEndpointCrawler: boolean;
  enableCveMatching: boolean;
}): ScanValidationResult {
  if (
    !body.runAllDiscovered &&
    (!body.selectedSubdomains || body.selectedSubdomains.length === 0)
  ) {
    return {
      ok: false,
      message: "Select at least one subdomain to continue scanning",
    };
  }
  return { ok: true };
}
