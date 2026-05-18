"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface ExportPanelProps {
  scanId: string;
  isEnterprise?: boolean;
  monthlyDownloadUsed?: number;
  monthlyDownloadLimit?: number;
}

const LIMIT_OPTIONS = [100, 500, 1000, 5000, 10000];

const SECTION_OPTIONS = [
  { key: "hosts", label: "Host Results" },
  { key: "selectedHosts", label: "Selected Subdomain Results" },
  { key: "endpoints", label: "Endpoints" },
  { key: "tech", label: "Technologies" },
  { key: "ports", label: "Open Ports" },
  { key: "dns", label: "DNS Records" },
  { key: "waf", label: "WAF/CDN" },
  { key: "cve", label: "CVE Matches" },
  { key: "progress", label: "Progress Events" },
];

export default function ExportPanel({
  scanId,
  isEnterprise = false,
  monthlyDownloadUsed = 0,
  monthlyDownloadLimit = 10000,
}: ExportPanelProps) {
  const [downLimit, setDownLimit] = useState(1000);
  const [downFormat, setDownFormat] = useState("csv");
  const [exportFormat, setExportFormat] = useState("json");
  const [sections, setSections] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const remaining = monthlyDownloadLimit - monthlyDownloadUsed;

  const toggleSection = (key: string) => {
    const next = new Set(sections);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSections(next);
  };

  const handleExport = () => {
    setExporting(true);
    const params = new URLSearchParams({ format: exportFormat });
    if (sections.size > 0) {
      params.set("sections", [...sections].join(","));
    }
    window.open(`/api/scans/${scanId}/export?${params.toString()}`, "_blank");
    setTimeout(() => setExporting(false), 1000);
  };

  const handleDownload = () => {
    setExporting(true);
    window.open(
      `/api/scans/${scanId}/subdomains-download?format=${downFormat}&limit=${downLimit}`,
      "_blank",
    );
    setTimeout(() => setExporting(false), 1000);
  };

  const CheckToggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: () => void;
  }) => (
    <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-gray-600 bg-navy-800 text-cyan-500 focus:ring-cyan-500"
      />
      {label}
    </label>
  );

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">
          Normal Export
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Select sections and format. Costs 1 credit. No monthly row cap.
        </p>
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-1.5">Sections:</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {SECTION_OPTIONS.map((opt) => {
              if (opt.key === "cve" && !isEnterprise) return null;
              return (
                <CheckToggle
                  key={opt.key}
                  label={opt.label}
                  checked={sections.has(opt.key)}
                  onChange={() => toggleSection(opt.key)}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">Format:</span>
          <select
            className="px-2 py-1 text-xs bg-navy-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-cyan-500"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="txt">TXT</option>
          </select>
        </div>
        <Button
          variant="secondary"
          className="text-xs"
          onClick={handleExport}
          loading={exporting}
        >
          Export Selected
        </Button>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">
          Host/Subdomain Download
        </h3>
        <div className="flex items-center gap-3 mb-3 text-xs">
          <span className="text-gray-400">
            Monthly usage:{" "}
            <span className="text-cyan-300">
              {monthlyDownloadUsed.toLocaleString()}
            </span>
            {" / "}
            <span className="text-cyan-300">
              {monthlyDownloadLimit.toLocaleString()}
            </span>
          </span>
          <Badge variant={remaining > 0 ? "green" : "red"}>
            {remaining.toLocaleString()} remaining
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">Limit:</span>
          <select
            className="px-2 py-1 text-xs bg-navy-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-cyan-500"
            value={downLimit}
            onChange={(e) => setDownLimit(Number(e.target.value))}
          >
            {LIMIT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o.toLocaleString()}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400 ml-2">Format:</span>
          <select
            className="px-2 py-1 text-xs bg-navy-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-cyan-500"
            value={downFormat}
            onChange={(e) => setDownFormat(e.target.value)}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="txt">TXT</option>
          </select>
        </div>
        <Button
          variant="secondary"
          className="text-xs"
          onClick={handleDownload}
          loading={exporting}
          disabled={remaining <= 0}
        >
          Download Hosts {downFormat.toUpperCase()}
        </Button>
      </Card>
    </div>
  );
}
