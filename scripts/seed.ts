import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";

const envPath = path.resolve(__dirname, "..", ".env");
const envExamplePath = path.resolve(__dirname, "..", ".env.example");
const fs = require("fs");
const configPath = fs.existsSync(envPath) ? envPath : envExamplePath;
dotenv.config({ path: configPath });

import { AppDataSource } from "../lib/data-source";
import { User } from "../entities/User";
import { RoleCreditDefault } from "../entities/RoleCreditDefault";
import { Scan } from "../entities/Scan";
import { Target } from "../entities/Target";
import { HostResult } from "../entities/HostResult";
import { TechFingerprint } from "../entities/TechFingerprint";
import { Endpoint } from "../entities/Endpoint";
import { CveMatch } from "../entities/CveMatch";
import { ScanProgressEvent } from "../entities/ScanProgressEvent";
import * as bcrypt from "bcryptjs";

const SEED_USERS = [
  {
    name: "Ansar",
    email: "admin@gmail.com",
    password: "admin123",
    role: "superadmin" as const,
    isActive: true,
  },
  {
    name: "Shuvro",
    email: "shuvro@company.com",
    password: "shuvro123",
    role: "enterprise" as const,
    isActive: true,
  },
  {
    name: "Abdullah",
    email: "abdullah@hunter.com",
    password: "abdullah123",
    role: "regular" as const,
    isActive: true,
  },
];

async function seed() {
  console.log("Connecting to PostgreSQL...");

  const ds = await AppDataSource.initialize();
  console.log("Connected. Starting seed...\n");

  const userRepo = ds.getRepository(User);
  const creditRepo = ds.getRepository(RoleCreditDefault);
  const scanRepo = ds.getRepository(Scan);
  const targetRepo = ds.getRepository(Target);
  const hrRepo = ds.getRepository(HostResult);
  const techRepo = ds.getRepository(TechFingerprint);
  const epRepo = ds.getRepository(Endpoint);
  const cveRepo = ds.getRepository(CveMatch);
  const progressRepo = ds.getRepository(ScanProgressEvent);

  const createdUsers: Record<string, User> = {};
  for (const u of SEED_USERS) {
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (existing) {
      console.log(`${u.role} ${u.email} already exists.`);
      createdUsers[u.email] = existing;
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await userRepo.save(
      userRepo.create({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: false,
      }),
    );
    createdUsers[u.email] = user;
    console.log(`${u.role} created: ${u.email} / ${u.password}`);
  }

  const defaults = [
    {
      role: "superadmin" as const,
      dailyScanLimit: 0,
      maxCrawlDepth: 0,
      cveEnabled: false,
      monthlySubdomainDownloadLimit: 0,
    },
    {
      role: "enterprise" as const,
      dailyScanLimit: 20,
      maxCrawlDepth: 3,
      cveEnabled: true,
      monthlySubdomainDownloadLimit: 1000000,
    },
    {
      role: "regular" as const,
      dailyScanLimit: 5,
      maxCrawlDepth: 2,
      cveEnabled: false,
      monthlySubdomainDownloadLimit: 10000,
    },
  ];
  for (const def of defaults) {
    const existing = await creditRepo.findOne({ where: { role: def.role } });
    if (existing) {
      await creditRepo.update({ role: def.role }, def);
    } else {
      await creditRepo.save(creditRepo.create(def));
    }
    console.log(
      `Credit defaults for ${def.role}: scans=${def.dailyScanLimit}, cve=${def.cveEnabled}`,
    );
  }

  const enterpriseUser = createdUsers["shuvro@company.com"];
  if (enterpriseUser) {
    const existingEnterpriseScan = await scanRepo.findOne({
      where: { targetValue: "example.com", userId: enterpriseUser.id },
    });
    if (!existingEnterpriseScan) {
      const scan = await scanRepo.save(
        scanRepo.create({
          userId: enterpriseUser.id,
          inputMode: "single",
          inputType: "domain",
          targetValue: "example.com",
          status: "completed",
          portProfile: "top100",
          crawlDepth: 2,
          cveEnabled: true,
          enableSubdomainDiscovery: true,
          enableIpThcLookup: true,
          enableDnsLookup: true,
          enableHttpProbe: true,
          enableWebsiteTitleExtraction: true,
          enablePortScan: true,
          enableTechnologyDetection: true,
          enableEndpointCrawler: true,
          enableCveMatching: true,
          cancelRequested: false,
          startedAt: new Date("2026-05-19T10:00:00Z"),
          finishedAt: new Date("2026-05-19T10:32:00Z"),
        }),
      );
      console.log(`Enterprise scan created: ${scan.id}`);

      await targetRepo.save(
        targetRepo.create({
          scanId: scan.id,
          type: "domain",
          value: "example.com",
          source: "manual",
        }),
      );
      await targetRepo.save(
        targetRepo.create({
          scanId: scan.id,
          type: "subdomain",
          value: "api.example.com",
          source: "manual",
        }),
      );

      const progressEvents = [
        { phase: "init", message: "Scan created", percent: 5 },
        { phase: "dns", message: "Subdomain discovery started", percent: 10 },
        {
          phase: "dns",
          message: "Existing PostgreSQL subdomains loaded",
          percent: 20,
        },
        { phase: "dns", message: "IPTHC subdomains loaded", percent: 30 },
        { phase: "dns", message: "Subdomain discovery completed", percent: 35 },
        {
          phase: "selected",
          message: "Waiting for selected subdomains",
          percent: 40,
        },
        {
          phase: "selected",
          message: "Selected subdomain list received",
          percent: 45,
        },
        { phase: "dns", message: "DNS lookup completed", percent: 50 },
        { phase: "probe", message: "Probing completed", percent: 55 },
        { phase: "port_scan", message: "Port scan completed", percent: 65 },
        {
          phase: "tech",
          message: "Technology detection completed",
          percent: 75,
        },
        { phase: "cve", message: "CVE matching completed", percent: 85 },
        { phase: "crawl", message: "Endpoint crawler completed", percent: 92 },
        {
          phase: "done",
          message: "Selected subdomain scan completed",
          percent: 100,
        },
      ];
      for (const ev of progressEvents) {
        await progressRepo.save(
          progressRepo.create({ scanId: scan.id, ...ev }),
        );
      }

      const hr1 = await hrRepo.save(
        hrRepo.create({
          scanId: scan.id,
          host: "example.com",
          displayTitle: "Example Domain",
          detectedType: "domain",
          rootDomain: "example.com",
          ipAddress: "93.184.216.34",
          country: "US",
          city: "Los Angeles",
          asn: "15169",
          organization: "VeriSign Inc.",
          aRecords: ["93.184.216.34"],
          aaaaRecords: ["2606:2800:220:1:248:1893:25c8:1946"],
          cnameRecords: [],
          mxRecords: ["mail.example.com"],
          nsRecords: ["a.iana-servers.net", "b.iana-servers.net"],
          txtRecords: ["v=spf1 include:_spf.example.com ~all"],
          statusCode: 200,
          pageTitle: "Example Domain",
          serverHeader: "ECS (dca/24A9)",
          poweredByHeader: "",
          finalUrl: "https://www.iana.org/domains/reserved",
          wafName: "Cloudflare",
          source: "manual",
          lastSeenOn: "2026-05-18",
          openPorts: [
            { port: 80, protocol: "tcp", service: "http" },
            { port: 443, protocol: "tcp", service: "https" },
          ],
          selectedForScan: true,
          selectedScanCompleted: true,
          selectedScanCompletedAt: new Date(),
        }),
      );
      const hr2 = await hrRepo.save(
        hrRepo.create({
          scanId: scan.id,
          host: "api.example.com",
          displayTitle: "Example API",
          detectedType: "subdomain",
          rootDomain: "example.com",
          ipAddress: "93.184.216.35",
          country: "US",
          city: "Los Angeles",
          asn: "15169",
          organization: "VeriSign Inc.",
          aRecords: ["93.184.216.35"],
          aaaaRecords: [],
          cnameRecords: [],
          mxRecords: [],
          nsRecords: ["a.iana-servers.net"],
          statusCode: 403,
          pageTitle: null,
          serverHeader: "nginx/1.24.0",
          poweredByHeader: "",
          finalUrl: "https://api.example.com/",
          source: "ipthc",
          lastSeenOn: "2026-05-17",
          openPorts: [{ port: 443, protocol: "tcp", service: "https" }],
          selectedForScan: true,
          selectedScanCompleted: true,
          selectedScanCompletedAt: new Date(),
        }),
      );
      const hr3 = await hrRepo.save(
        hrRepo.create({
          scanId: scan.id,
          host: "admin.example.com",
          displayTitle: "Admin Panel",
          detectedType: "subdomain",
          rootDomain: "example.com",
          ipAddress: "93.184.216.36",
          country: "US",
          city: "Los Angeles",
          asn: "15169",
          organization: "VeriSign Inc.",
          aRecords: ["93.184.216.36"],
          cnameRecords: [],
          mxRecords: [],
          nsRecords: ["a.iana-servers.net"],
          statusCode: 200,
          pageTitle: "Admin Dashboard — Example Corp",
          serverHeader: "nginx/1.24.0",
          poweredByHeader: "PHP/8.2.0",
          finalUrl: "https://admin.example.com/dashboard",
          source: "ipthc",
          lastSeenOn: "2026-05-17",
          openPorts: [
            { port: 443, protocol: "tcp", service: "https" },
            { port: 22, protocol: "tcp", service: "ssh" },
          ],
          selectedForScan: true,
          selectedScanCompleted: true,
          selectedScanCompletedAt: new Date(),
        }),
      );
      await hrRepo.save(
        hrRepo.create({
          scanId: scan.id,
          host: "mail.example.com",
          displayTitle: "Example Mail",
          detectedType: "subdomain",
          rootDomain: "example.com",
          ipAddress: "93.184.216.37",
          country: "US",
          city: "Los Angeles",
          aRecords: ["93.184.216.37"],
          mxRecords: ["mail.example.com"],
          nsRecords: ["a.iana-servers.net"],
          source: "ipthc",
          lastSeenOn: "2026-05-16",
          openPorts: [
            { port: 25, protocol: "tcp", service: "smtp" },
            { port: 587, protocol: "tcp", service: "smtp" },
          ],
          selectedForScan: false,
          selectedScanCompleted: false,
        }),
      );

      for (const host of [hr1, hr2, hr3]) {
        if (host === hr1) {
          await techRepo.save(
            techRepo.create({
              hostResultId: hr1.id,
              name: "IIS",
              version: "10.0",
              source: "manual",
              confidence: 90,
            }),
          );
          await techRepo.save(
            techRepo.create({
              hostResultId: hr1.id,
              name: "ASP.NET",
              version: "4.8",
              source: "wappalyzer",
              confidence: 85,
            }),
          );
          await techRepo.save(
            techRepo.create({
              hostResultId: hr1.id,
              name: "jQuery",
              version: "3.6.0",
              source: "wappalyzer",
              confidence: 95,
            }),
          );
        } else if (host === hr2) {
          await techRepo.save(
            techRepo.create({
              hostResultId: hr2.id,
              name: "Nginx",
              version: "1.24.0",
              source: "manual",
              confidence: 100,
            }),
          );
          await techRepo.save(
            techRepo.create({
              hostResultId: hr2.id,
              name: "PHP",
              version: "8.2.0",
              source: "wappalyzer",
              confidence: 80,
            }),
          );
        } else {
          await techRepo.save(
            techRepo.create({
              hostResultId: hr3.id,
              name: "Nginx",
              version: "1.24.0",
              source: "manual",
              confidence: 100,
            }),
          );
          await techRepo.save(
            techRepo.create({
              hostResultId: hr3.id,
              name: "PHP",
              version: "8.2.0",
              source: "wappalyzer",
              confidence: 80,
            }),
          );
          await techRepo.save(
            techRepo.create({
              hostResultId: hr3.id,
              name: "Laravel",
              version: "10",
              source: "wappalyzer",
              confidence: 75,
            }),
          );
        }
      }

      await epRepo.save(
        epRepo.create({
          hostResultId: hr1.id,
          url: "https://example.com/",
          path: "/",
          method: "GET",
          statusCode: 200,
          depth: 0,
          keptByUro: true,
        }),
      );
      await epRepo.save(
        epRepo.create({
          hostResultId: hr1.id,
          url: "https://example.com/about",
          path: "/about",
          method: "GET",
          statusCode: 200,
          depth: 1,
          keptByUro: true,
        }),
      );
      await epRepo.save(
        epRepo.create({
          hostResultId: hr1.id,
          url: "https://example.com/contact",
          path: "/contact",
          method: "GET",
          statusCode: 200,
          depth: 1,
          keptByUro: true,
        }),
      );
      await epRepo.save(
        epRepo.create({
          hostResultId: hr2.id,
          url: "https://api.example.com/v1/users",
          path: "/v1/users",
          method: "GET",
          statusCode: 403,
          depth: 0,
          keptByUro: true,
        }),
      );
      await epRepo.save(
        epRepo.create({
          hostResultId: hr2.id,
          url: "https://api.example.com/v1/health",
          path: "/v1/health",
          method: "GET",
          statusCode: 200,
          depth: 0,
          keptByUro: true,
        }),
      );
      await epRepo.save(
        epRepo.create({
          hostResultId: hr3.id,
          url: "https://admin.example.com/dashboard",
          path: "/dashboard",
          method: "GET",
          statusCode: 200,
          depth: 0,
          keptByUro: true,
        }),
      );
      await epRepo.save(
        epRepo.create({
          hostResultId: hr3.id,
          url: "https://admin.example.com/users",
          path: "/users",
          method: "GET",
          statusCode: 200,
          depth: 1,
          keptByUro: true,
        }),
      );
      await epRepo.save(
        epRepo.create({
          hostResultId: hr3.id,
          url: "https://admin.example.com/settings",
          path: "/settings",
          method: "GET",
          statusCode: 200,
          depth: 1,
          keptByUro: true,
        }),
      );

      await cveRepo.save(
        cveRepo.create({
          hostResultId: hr1.id,
          cveId: "CVE-2024-35250",
          severity: "high",
          score: 8.8,
          summary:
            "Microsoft IIS 10.0 is vulnerable to an unspecified vulnerability that allows remote code execution via a specially crafted request.",
        }),
      );
      await cveRepo.save(
        cveRepo.create({
          hostResultId: hr1.id,
          cveId: "CVE-2024-37323",
          severity: "medium",
          score: 6.5,
          summary:
            "Microsoft IIS 10.0 denial of service vulnerability. An attacker could exploit this vulnerability to cause a denial of service.",
        }),
      );
      await cveRepo.save(
        cveRepo.create({
          hostResultId: hr2.id,
          cveId: "CVE-2024-7343",
          severity: "high",
          score: 7.5,
          summary:
            "Nginx 1.24.0 HTTP/2 rapid reset attack vulnerability allows remote attackers to cause a denial of service.",
        }),
      );
      await cveRepo.save(
        cveRepo.create({
          hostResultId: hr3.id,
          cveId: "CVE-2024-45409",
          severity: "critical",
          score: 9.1,
          summary:
            "Laravel 10 prior to 10.48.0 contains a session fixation vulnerability that could allow an attacker to hijack user sessions.",
        }),
      );
      await cveRepo.save(
        cveRepo.create({
          hostResultId: hr3.id,
          cveId: "CVE-2024-5456",
          severity: "medium",
          score: 5.3,
          summary:
            "PHP 8.2.0 XML External Entity (XXE) processing vulnerability allows disclosure of local files via crafted XML input.",
        }),
      );

      console.log(`Sample data created for enterprise scan (example.com)`);
    } else {
      console.log(`Enterprise scan for example.com already exists. Skipping.`);
    }
  }

  const regularUser = createdUsers["abdullah@hunter.com"];
  if (regularUser) {
    const existingRegularScan = await scanRepo.findOne({
      where: { targetValue: "testsite.org", userId: regularUser.id },
    });
    if (!existingRegularScan) {
      const scan = await scanRepo.save(
        scanRepo.create({
          userId: regularUser.id,
          inputMode: "single",
          inputType: "domain",
          targetValue: "testsite.org",
          status: "completed",
          portProfile: "top100",
          crawlDepth: 1,
          cveEnabled: false,
          enableSubdomainDiscovery: true,
          enableIpThcLookup: true,
          enableDnsLookup: true,
          enableHttpProbe: true,
          enableWebsiteTitleExtraction: true,
          enablePortScan: true,
          enableTechnologyDetection: true,
          enableEndpointCrawler: true,
          enableCveMatching: false,
          cancelRequested: false,
          startedAt: new Date("2026-05-18T14:00:00Z"),
          finishedAt: new Date("2026-05-18T14:25:00Z"),
        }),
      );
      console.log(`Regular scan created: ${scan.id}`);

      await targetRepo.save(
        targetRepo.create({
          scanId: scan.id,
          type: "domain",
          value: "testsite.org",
          source: "manual",
        }),
      );

      const progressEvents = [
        { phase: "init", message: "Scan created", percent: 5 },
        { phase: "dns", message: "Subdomain discovery started", percent: 10 },
        { phase: "dns", message: "IPTHC subdomains loaded", percent: 30 },
        { phase: "dns", message: "Subdomain discovery completed", percent: 35 },
        {
          phase: "selected",
          message: "Selected subdomain list received",
          percent: 45,
        },
        { phase: "dns", message: "DNS lookup completed", percent: 50 },
        { phase: "probe", message: "Probing completed", percent: 55 },
        { phase: "port_scan", message: "Port scan completed", percent: 65 },
        {
          phase: "tech",
          message: "Technology detection completed",
          percent: 75,
        },
        { phase: "crawl", message: "Endpoint crawler completed", percent: 92 },
        {
          phase: "done",
          message: "Selected subdomain scan completed",
          percent: 100,
        },
      ];
      for (const ev of progressEvents) {
        await progressRepo.save(
          progressRepo.create({ scanId: scan.id, ...ev }),
        );
      }

      const hr1 = await hrRepo.save(
        hrRepo.create({
          scanId: scan.id,
          host: "testsite.org",
          displayTitle: "Test Site",
          detectedType: "domain",
          rootDomain: "testsite.org",
          ipAddress: "192.0.2.1",
          country: "US",
          city: "Ashburn",
          asn: "15169",
          organization: "Test Organization",
          aRecords: ["192.0.2.1"],
          cnameRecords: [],
          mxRecords: [],
          nsRecords: ["ns1.testsite.org"],
          statusCode: 200,
          pageTitle: "Test Site — Welcome",
          serverHeader: "Apache/2.4.57",
          finalUrl: "https://testsite.org/",
          source: "manual",
          openPorts: [
            { port: 80, protocol: "tcp", service: "http" },
            { port: 443, protocol: "tcp", service: "https" },
          ],
          selectedForScan: true,
          selectedScanCompleted: true,
          selectedScanCompletedAt: new Date(),
        }),
      );

      await techRepo.save(
        techRepo.create({
          hostResultId: hr1.id,
          name: "Apache",
          version: "2.4.57",
          source: "manual",
          confidence: 100,
        }),
      );
      await techRepo.save(
        techRepo.create({
          hostResultId: hr1.id,
          name: "WordPress",
          version: "6.5",
          source: "wappalyzer",
          confidence: 85,
        }),
      );
      await techRepo.save(
        techRepo.create({
          hostResultId: hr1.id,
          name: "MySQL",
          version: "8.0",
          source: "wappalyzer",
          confidence: 60,
        }),
      );

      await epRepo.save(
        epRepo.create({
          hostResultId: hr1.id,
          url: "https://testsite.org/",
          path: "/",
          method: "GET",
          statusCode: 200,
          depth: 0,
          keptByUro: true,
        }),
      );
      await epRepo.save(
        epRepo.create({
          hostResultId: hr1.id,
          url: "https://testsite.org/wp-admin",
          path: "/wp-admin",
          method: "GET",
          statusCode: 302,
          depth: 1,
          keptByUro: true,
        }),
      );

      console.log(`Sample data created for regular scan (testsite.org)`);
    } else {
      console.log(`Regular scan for testsite.org already exists. Skipping.`);
    }
  }

  console.log("\nSeed completed successfully.");
  await ds.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
