"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function BasicScanForm() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<"single" | "txt_upload">("single");
  const [targetValue, setTargetValue] = useState("");
  const [targetType, setTargetType] = useState("domain");
  const [txtContent, setTxtContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [enableSubdomainDiscovery, setEnableSubdomainDiscovery] =
    useState(true);
  const [enableIpThcLookup, setEnableIpThcLookup] = useState(true);
  const [enableDnsLookup, setEnableDnsLookup] = useState(true);
  const [enableHttpProbe, setEnableHttpProbe] = useState(true);
  const [enableWebsiteTitleExtraction, setEnableWebsiteTitleExtraction] =
    useState(true);
  const [enablePortScan, setEnablePortScan] = useState(true);
  const [enableTechnologyDetection, setEnableTechnologyDetection] =
    useState(true);
  const [enableEndpointCrawler, setEnableEndpointCrawler] = useState(true);
  const [discoverOnly, setDiscoverOnly] = useState(false);

  const handleHttpProbeToggle = (v: boolean) => {
    setEnableHttpProbe(v);
    if (!v) {
      setEnableWebsiteTitleExtraction(false);
      setEnableEndpointCrawler(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const value =
      inputMode === "single" ? targetValue.trim() : txtContent.trim();
    if (!value) {
      setError("Target is required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        inputMode,
        targetValue: value,
        inputType: inputMode === "single" ? targetType : "mixed",
        portProfile: "top100",
        crawlDepth: 2,
        enableSubdomainDiscovery,
        enableIpThcLookup,
        enableDnsLookup,
        enableHttpProbe,
        enableWebsiteTitleExtraction,
        enablePortScan,
        enableTechnologyDetection,
        enableEndpointCrawler,
        enableCveMatching: false,
        discoverOnly,
      };
      const { data } = await axios.post("/api/scans", payload);
      if (data.success) {
        setSuccess("Scan created successfully!");
        setTimeout(() => router.push("/regular/scans"), 1500);
      } else {
        setError(data.message || "Failed");
      }
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err) ? err.response?.data?.message : "Failed",
      );
    } finally {
      setLoading(false);
    }
  };

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
    <Card glow>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm text-gray-300 font-medium">
            Input Mode
          </label>
          <div className="flex gap-2 mt-1">
            <Button
              type="button"
              variant={inputMode === "single" ? "primary" : "secondary"}
              className="text-sm"
              onClick={() => setInputMode("single")}
            >
              Single Target
            </Button>
            <Button
              type="button"
              variant={inputMode === "txt_upload" ? "primary" : "secondary"}
              className="text-sm"
              onClick={() => setInputMode("txt_upload")}
            >
              TXT Upload
            </Button>
          </div>
        </div>
        {inputMode === "single" ? (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-300 font-medium">
                Target Type
              </label>
              <select
                className="w-full px-3 py-2 bg-navy-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:border-cyan-500"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
              >
                <option value="domain">Domain</option>
                <option value="subdomain">Subdomain</option>
              </select>
            </div>
            <Input
              label="Target Value"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="e.g. github.com"
              required
            />
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300 font-medium">
              Targets (domains/subdomains only)
            </label>
            <textarea
              value={txtContent}
              onChange={(e) => setTxtContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 bg-navy-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono text-sm resize-none"
              placeholder={"github.com\napi.github.com"}
              required
            />
          </div>
        )}

        <div className="border-t border-cyan-500/15 pt-4">
          <p className="text-sm text-cyan-400 font-medium mb-3">
            Phase 1 — Discovery
          </p>
          <div className="space-y-2">
            <Toggle
              label="Subdomain Discovery"
              value={enableSubdomainDiscovery}
              onChange={setEnableSubdomainDiscovery}
            />
            <Toggle
              label="IPTHC Subdomain Lookup"
              value={enableIpThcLookup}
              onChange={setEnableIpThcLookup}
              disabled={!enableSubdomainDiscovery}
            />
          </div>
        </div>

        <div className="border-t border-cyan-500/15 pt-4">
          <p className="text-sm text-cyan-400 font-medium mb-3">
            Phase 2 — Modules
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Toggle
              label="DNS Helper"
              value={enableDnsLookup}
              onChange={setEnableDnsLookup}
            />
            <Toggle
              label="HTTP/HTTPS Probe"
              value={enableHttpProbe}
              onChange={handleHttpProbeToggle}
            />
            <Toggle
              label="Website Title Extraction"
              value={enableWebsiteTitleExtraction}
              onChange={setEnableWebsiteTitleExtraction}
              disabled={!enableHttpProbe}
            />
            <Toggle
              label="Port Scan (Top 100)"
              value={enablePortScan}
              onChange={setEnablePortScan}
            />
            <Toggle
              label="Technology Detection"
              value={enableTechnologyDetection}
              onChange={setEnableTechnologyDetection}
            />
            <Toggle
              label="Endpoint Crawler"
              value={enableEndpointCrawler}
              onChange={setEnableEndpointCrawler}
              disabled={!enableHttpProbe}
            />
          </div>
        </div>

        <Toggle
          label="Discovery Only (skip Phase 2)"
          value={discoverOnly}
          onChange={setDiscoverOnly}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Start Scan
        </Button>
      </form>
    </Card>
  );
}
