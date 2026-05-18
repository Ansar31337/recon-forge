"use client";

import React, { useState } from "react";
import axios from "axios";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface Subdomain {
  id: string;
  host: string;
  displayTitle: string;
  detectedType: string | null;
  rootDomain: string | null;
  source: string | null;
}

interface SubdomainSelectionPanelProps {
  scanId: string;
  subdomains: Subdomain[];
  loading: boolean;
  error: string | null;
  isEnterprise: boolean;
  onScanComplete: () => void;
  externalSelected?: Set<string>;
  onExternalToggle?: (host: string) => void;
  onExternalSelectAll?: () => void;
  onExternalClearAll?: () => void;
}

export default function SubdomainSelectionPanel({
  scanId,
  subdomains,
  loading,
  error,
  isEnterprise,
  onScanComplete,
  externalSelected,
  onExternalToggle,
  onExternalSelectAll,
  onExternalClearAll,
}: SubdomainSelectionPanelProps) {
  const [internalSelected, setInternalSelected] = useState<Set<string>>(
    new Set(),
  );
  const [runAll, setRunAll] = useState(false);

  const [enableDnsLookup, setEnableDnsLookup] = useState(true);
  const [enableHttpProbe, setEnableHttpProbe] = useState(true);
  const [enableWebsiteTitleExtraction, setEnableWebsiteTitleExtraction] =
    useState(true);
  const [enablePortScan, setEnablePortScan] = useState(false);
  const [enableTechnologyDetection, setEnableTechnologyDetection] =
    useState(true);
  const [enableEndpointCrawler, setEnableEndpointCrawler] = useState(false);
  const [enableCveMatching, setEnableCveMatching] = useState(false);

  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [resultError, setResultError] = useState("");

  const selected = externalSelected ?? internalSelected;

  const toggle =
    onExternalToggle ||
    ((host: string) => {
      const next = new Set(internalSelected);
      if (next.has(host)) next.delete(host);
      else next.add(host);
      setInternalSelected(next);
    });

  const selectAll =
    onExternalSelectAll ||
    (() => setInternalSelected(new Set(subdomains.map((s) => s.host))));
  const clearAll = onExternalClearAll || (() => setInternalSelected(new Set()));

  const handleRunSelected = async () => {
    setResultError("");
    setResultMsg("");
    if (!runAll && selected.size === 0) {
      setResultError("Select at least one subdomain");
      return;
    }
    setSending(true);
    try {
      const { data } = await axios.post(`/api/scans/${scanId}/run-selected`, {
        selectedSubdomains: runAll ? [] : [...selected],
        runAllDiscovered: runAll,
        enableDnsLookup,
        enableHttpProbe,
        enableWebsiteTitleExtraction,
        enablePortScan,
        enableTechnologyDetection,
        enableEndpointCrawler,
        enableCveMatching: isEnterprise ? enableCveMatching : false,
      });
      if (data.success) {
        setResultMsg("Scan completed!");
        onScanComplete();
      } else {
        setResultError(data.message || "Failed");
      }
    } catch (err: unknown) {
      setResultError(
        axios.isAxiosError(err) ? err.response?.data?.message : "Failed",
      );
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="text-cyan-300 py-8 text-center">
        Loading subdomains...
      </div>
    );
  if (error)
    return <div className="text-red-400 py-8 text-center">{error}</div>;
  if (subdomains.length === 0)
    return (
      <Card>
        <p className="text-gray-400 text-center py-6">
          No subdomains discovered yet.
        </p>
      </Card>
    );

  const Toggle = ({
    label,
    value,
    onChange,
    disabled,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <label
      className={`flex items-center gap-2 text-sm ${disabled ? "text-gray-500 cursor-not-allowed" : "text-gray-300 cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded border-gray-600 bg-navy-800 text-cyan-500 focus:ring-cyan-500"
      />
      {label}
    </label>
  );

  return (
    <div className="space-y-4">
      <Card glow>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-cyan-400">
            Discovered Subdomains ({subdomains.length})
          </h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-xs px-2 py-1"
              onClick={selectAll}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              className="text-xs px-2 py-1"
              onClick={clearAll}
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {subdomains.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-navy-700/50 cursor-pointer border border-cyan-500/10"
            >
              <input
                type="checkbox"
                checked={selected.has(s.host)}
                onChange={() => toggle(s.host)}
                className="rounded border-gray-600 bg-navy-800 text-cyan-500 focus:ring-cyan-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{s.host}</p>
                <p className="text-xs text-gray-500">{s.displayTitle}</p>
              </div>
              <Badge variant="gray" className="shrink-0">
                {s.source || "manual"}
              </Badge>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <Toggle
            label="Run all discovered subdomains"
            value={runAll}
            onChange={setRunAll}
          />
        </div>
      </Card>

      <Card glow>
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">
          Phase 2 — Enabled Modules
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Toggle
            label="DNS Helper"
            value={enableDnsLookup}
            onChange={setEnableDnsLookup}
          />
          <Toggle
            label="HTTP/HTTPS Probe"
            value={enableHttpProbe}
            onChange={(v) => {
              setEnableHttpProbe(v);
              if (!v) {
                setEnableWebsiteTitleExtraction(false);
                setEnableEndpointCrawler(false);
              }
            }}
          />
          <Toggle
            label="Website Title Extraction"
            value={enableWebsiteTitleExtraction}
            onChange={setEnableWebsiteTitleExtraction}
            disabled={!enableHttpProbe}
          />
          <Toggle
            label="Port Scan"
            value={enablePortScan}
            onChange={setEnablePortScan}
          />
          <Toggle
            label="Technology Detection"
            value={enableTechnologyDetection}
            onChange={(v) => {
              setEnableTechnologyDetection(v);
              if (!v) setEnableCveMatching(false);
            }}
          />
          <Toggle
            label="Endpoint Crawler + URO"
            value={enableEndpointCrawler}
            onChange={setEnableEndpointCrawler}
            disabled={!enableHttpProbe}
          />
          {isEnterprise && (
            <Toggle
              label="CVE Matching"
              value={enableCveMatching}
              onChange={setEnableCveMatching}
              disabled={!enableTechnologyDetection}
            />
          )}
        </div>

        {resultError && (
          <p className="text-sm text-red-400 mb-3">{resultError}</p>
        )}
        {resultMsg && (
          <p className="text-sm text-green-400 mb-3">{resultMsg}</p>
        )}
        <Button
          onClick={handleRunSelected}
          loading={sending}
          className="w-full"
        >
          {runAll ? "Run All Discovered" : `Run Selected (${selected.size})`}
        </Button>
      </Card>
    </div>
  );
}
