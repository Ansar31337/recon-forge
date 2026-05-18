import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface HostResult {
  id: string;
  host: string;
  displayTitle: string | null;
  pageTitle: string | null;
  detectedType: string | null;
  rootDomain: string | null;
  ipAddress: string | null;
  cnameRecords: string[] | null;
  aRecords: string[] | null;
  aaaaRecords: string[] | null;
  statusCode: number | null;
  serverHeader: string | null;
  poweredByHeader: string | null;
  wafName: string | null;
  source: string | null;
  lastSeenOn: string | null;
  openPorts: unknown[] | null;
  country: string | null;
  city: string | null;
  asn: string | null;
  organization: string | null;
}

interface HostCardProps {
  host: HostResult;
}

export default function HostCard({ host }: HostCardProps) {
  return (
    <Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Host</p>
          <p className="text-gray-200 font-medium">{host.host || "-"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Generated Title</p>
          <p className="text-gray-200">{host.displayTitle || "-"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Website Title</p>
          <p className="text-gray-200">
            {host.pageTitle || "Website title not found"}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Status / IP</p>
          <p className="text-gray-200">
            {host.statusCode ? `HTTP ${host.statusCode}` : "-"} /{" "}
            {host.ipAddress || "-"}
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-xs">Type</p>
          <Badge variant="cyan">{host.detectedType || "-"}</Badge>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Root Domain</p>
          <p className="text-gray-200">{host.rootDomain || "-"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Server</p>
          <p className="text-gray-200">{host.serverHeader || "-"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">X-Powered-By</p>
          <p className="text-gray-200">{host.poweredByHeader || "-"}</p>
        </div>

        <div>
          <p className="text-gray-400 text-xs">Source</p>
          <p className="text-gray-200">{host.source || "-"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Last Seen</p>
          <p className="text-gray-200">{host.lastSeenOn || "-"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Country / City</p>
          <p className="text-gray-200">
            {[host.country, host.city].filter(Boolean).join(", ") || "-"}
          </p>
        </div>

        {host.wafName ? (
          <div>
            <p className="text-gray-400 text-xs">WAF/CDN</p>
            <Badge variant="yellow">{host.wafName}</Badge>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-xs">WAF/CDN</p>
            <p className="text-gray-500 text-xs">None detected</p>
          </div>
        )}

        {host.cnameRecords && host.cnameRecords.length > 0 ? (
          <div className="col-span-full">
            <p className="text-gray-400 text-xs mb-1">CNAME Records</p>
            <p className="text-gray-200 text-xs font-mono break-all">
              {host.cnameRecords.join(", ")}
            </p>
          </div>
        ) : null}

        {host.aRecords && host.aRecords.length > 0 ? (
          <div className="col-span-2">
            <p className="text-gray-400 text-xs mb-1">A Records</p>
            <p className="text-gray-200 text-xs font-mono break-all">
              {host.aRecords.join(", ")}
            </p>
          </div>
        ) : null}

        {host.aaaaRecords && host.aaaaRecords.length > 0 ? (
          <div className="col-span-2">
            <p className="text-gray-400 text-xs mb-1">AAAA Records</p>
            <p className="text-gray-200 text-xs font-mono break-all">
              {host.aaaaRecords.join(", ")}
            </p>
          </div>
        ) : null}

        {host.asn ? (
          <div className="col-span-2">
            <p className="text-gray-400 text-xs">ASN / Organization</p>
            <p className="text-gray-200 text-xs">
              {host.asn}
              {host.organization ? ` — ${host.organization}` : ""}
            </p>
          </div>
        ) : null}

        {host.openPorts && (host.openPorts as unknown[]).length > 0 ? (
          <div className="col-span-full">
            <p className="text-gray-400 text-xs mb-1">Open Ports</p>
            <div className="flex flex-wrap gap-1">
              {(host.openPorts as { port: number; service: string }[]).map(
                (p, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded"
                  >
                    {p.port}/{p.service}
                  </span>
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
