"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressRibbon from "@/components/scans/ProgressRibbon";
import HostCard from "@/components/scans/HostCard";
import TechCard from "@/components/scans/TechCard";
import EndpointList from "@/components/scans/EndpointList";
import ExportPanel from "@/components/scans/ExportPanel";
import SubdomainSelectionPanel from "@/components/scans/SubdomainSelectionPanel";

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
  selectedForScan?: boolean;
}

interface Subdomain {
  id: string;
  host: string;
  displayTitle: string;
  detectedType: string | null;
  rootDomain: string | null;
  source: string | null;
}

interface PageData<T> {
  items: T[];
  pagination: {
    currentPage: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

const LIMIT_OPTIONS = [10, 20, 50, 100];

function PageButtons({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const nums: number[] = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);
  for (let i = start; i <= end; i++) nums.push(i);
  if (!nums.includes(1)) nums.unshift(1);
  if (!nums.includes(totalPages)) nums.push(totalPages);

  return (
    <div className="flex items-center gap-1 mt-3 flex-wrap">
      <Button
        variant="ghost"
        className="text-xs px-2 py-1"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      {nums.map((n) => (
        <Button
          key={n}
          variant={n === page ? "primary" : "ghost"}
          className="text-xs px-2 py-1 min-w-[28px]"
          onClick={() => onChange(n)}
        >
          {n}
        </Button>
      ))}
      <Button
        variant="ghost"
        className="text-xs px-2 py-1"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

function LimitSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <select
      className="px-2 py-1 text-xs bg-navy-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-cyan-500"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {LIMIT_OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o} per page
        </option>
      ))}
    </select>
  );
}

interface SectionBlockProps {
  title: string;
  count: number;
  show: boolean;
  onToggle: () => void;
  limit: number;
  onLimitChange: (v: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  children: React.ReactNode;
  emptyMsg: string;
}

function SectionBlock({
  title,
  count,
  show,
  onToggle,
  limit,
  onLimitChange,
  page,
  totalPages,
  onPageChange,
  children,
  emptyMsg,
}: SectionBlockProps) {
  const from = count === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, count);
  return (
    <div className="border border-cyan-500/10 rounded-lg p-4 bg-navy-800/40">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <Button
          variant={show ? "primary" : "secondary"}
          className="text-xs"
          onClick={onToggle}
        >
          {title} ({count})
        </Button>
        {show && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Show:</span>
            <LimitSelector value={limit} onChange={onLimitChange} />
          </div>
        )}
      </div>
      {show ? (
        count > 0 ? (
          <>
            <p className="text-xs text-gray-500 mb-2">
              Showing {from}–{to} of {count}
            </p>
            {children}
            <PageButtons
              page={page}
              totalPages={totalPages}
              onChange={onPageChange}
            />
          </>
        ) : (
          <p className="text-sm text-gray-500 py-4 text-center">{emptyMsg}</p>
        )
      ) : null}
    </div>
  );
}

export default function RegularScanDetail() {
  const { id } = useParams();
  const [scan, setScan] = useState<Record<string, unknown> | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hostData, setHostData] = useState<PageData<HostResult>>({
    items: [],
    pagination: { currentPage: 1, limit: 20, totalItems: 0, totalPages: 1 },
  });
  const [selectedData, setSelectedData] = useState<PageData<HostResult>>({
    items: [],
    pagination: { currentPage: 1, limit: 20, totalItems: 0, totalPages: 1 },
  });
  const [endpointData, setEndpointData] = useState<
    PageData<Record<string, unknown>>
  >({
    items: [],
    pagination: { currentPage: 1, limit: 20, totalItems: 0, totalPages: 1 },
  });
  const [techData, setTechData] = useState<PageData<Record<string, unknown>>>({
    items: [],
    pagination: { currentPage: 1, limit: 20, totalItems: 0, totalPages: 1 },
  });
  const [progress, setProgress] = useState<Record<string, unknown>[]>([]);
  const [discoveredSubdomains, setDiscoveredSubdomains] = useState<Subdomain[]>(
    [],
  );
  const [credits, setCredits] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [hostLimit, setHostLimit] = useState(20);
  const [selectedLimit, setSelectedLimit] = useState(20);
  const [endpointLimit, setEndpointLimit] = useState(20);
  const [techLimit, setTechLimit] = useState(20);
  const [hostPage, setHostPage] = useState(1);
  const [selectedPage, setSelectedPage] = useState(1);
  const [endpointPage, setEndpointPage] = useState(1);
  const [techPage, setTechPage] = useState(1);
  const [showHost, setShowHost] = useState(false);
  const [showSelected, setShowSelected] = useState(false);
  const [showEndpoints, setShowEndpoints] = useState(false);
  const [showTech, setShowTech] = useState(false);
  const [phase2Hosts, setPhase2Hosts] = useState<Set<string>>(new Set());
  const [showPhase2Panel, setShowPhase2Panel] = useState(false);

  const loadScanRef = useRef<() => Promise<void>>(async () => {});
  loadScanRef.current = async () => {
    const p = new URLSearchParams();
    p.set("hostPage", String(hostPage));
    p.set("hostLimit", String(hostLimit));
    p.set("selectedPage", String(selectedPage));
    p.set("selectedLimit", String(selectedLimit));
    p.set("endpointPage", String(endpointPage));
    p.set("endpointLimit", String(endpointLimit));
    p.set("techPage", String(techPage));
    p.set("techLimit", String(techLimit));
    const url = `/api/scans/${id}?${p.toString()}`;
    try {
      const [scanRes, credRes] = await Promise.all([
        axios.get(url),
        axios.get("/api/credits/me"),
      ]);
      const d = scanRes.data.data;
      setScan(d.scan || null);
      setCounts(d.counts || {});
      setHostData(
        d.hostResults || {
          items: [],
          pagination: {
            currentPage: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 1,
          },
        },
      );
      setSelectedData(
        d.selectedHostResults || {
          items: [],
          pagination: {
            currentPage: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 1,
          },
        },
      );
      setEndpointData(
        d.endpoints || {
          items: [],
          pagination: {
            currentPage: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 1,
          },
        },
      );
      setTechData(
        d.technologies || {
          items: [],
          pagination: {
            currentPage: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 1,
          },
        },
      );
      setProgress(d.progress || []);
      setDiscoveredSubdomains(d.discoveredSubdomains || []);
      setCredits(credRes.data.data || {});
    } catch {
      setError("Failed to load scan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScanRef.current();
    const interval = setInterval(() => loadScanRef.current(), 5000);
    return () => clearInterval(interval);
  }, [
    id,
    hostPage,
    hostLimit,
    selectedPage,
    selectedLimit,
    endpointPage,
    endpointLimit,
    techPage,
    techLimit,
  ]);

  const cancelScan = async () => {
    if (!confirm("Cancel this scan?")) return;
    setCancelling(true);
    await axios.post(`/api/scans/${id}/cancel`);
    loadScanRef.current();
    setCancelling(false);
  };

  const crawlStarted = progress.filter(
    (p) =>
      String(p.phase) === "crawl" &&
      String(p.message).startsWith("Endpoint crawler started for"),
  ).length;
  const crawlCompleted = progress.filter(
    (p) =>
      String(p.phase) === "crawl" &&
      String(p.message).startsWith("Endpoint crawler completed for"),
  ).length;
  const isCrawling = crawlStarted > crawlCompleted;
  const displayStatus = isCrawling
    ? "progressing"
    : String(scan?.status || "unknown");
  const statusVariant =
    displayStatus === "completed"
      ? "green"
      : displayStatus === "running" || displayStatus === "progressing"
        ? "yellow"
        : displayStatus === "failed"
          ? "red"
          : "gray";

  const isWaiting =
    progress.some(
      (p) => String(p.message) === "Waiting for selected subdomains",
    ) ||
    (displayStatus === "running" && !selectedData.pagination?.totalItems);

  const toggleP2Host = (host: string) => {
    const next = new Set(phase2Hosts);
    if (next.has(host)) next.delete(host);
    else next.add(host);
    setPhase2Hosts(next);
  };
  const selectAllP2 = () =>
    setPhase2Hosts(new Set(hostData.items.map((h) => h.host)));
  const clearAllP2 = () => setPhase2Hosts(new Set());

  if (loading && !scan) return <div className="text-cyan-300">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!scan) return <div className="text-red-400">Scan not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {String(scan.targetValue || "Unknown")}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="cyan">{String(scan.inputType || "-")}</Badge>
            <Badge variant={statusVariant}>{displayStatus}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {displayStatus === "running" || displayStatus === "progressing" ? (
            <Button variant="danger" onClick={cancelScan} loading={cancelling}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <ProgressRibbon events={progress as any[]} />

      {(isWaiting || showPhase2Panel) && (
        <SubdomainSelectionPanel
          scanId={String(id)}
          subdomains={discoveredSubdomains}
          loading={false}
          error={null}
          isEnterprise={false}
          onScanComplete={() => {
            loadScanRef.current();
            setShowPhase2Panel(false);
          }}
          externalSelected={phase2Hosts}
          onExternalToggle={toggleP2Host}
          onExternalSelectAll={selectAllP2}
          onExternalClearAll={clearAllP2}
        />
      )}

      {!isWaiting &&
        !showPhase2Panel &&
        (hostData.pagination?.totalItems ?? 0) > 0 && (
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setShowPhase2Panel(true);
                setPhase2Hosts(new Set());
              }}
              variant="secondary"
              className="text-sm"
            >
              Run Phase 2 — Scan Additional Subdomains
            </Button>
          </div>
        )}

      <ExportPanel
        scanId={String(id)}
        isEnterprise={false}
        monthlyDownloadUsed={Number(credits.monthlyDownloadUsed || 0)}
        monthlyDownloadLimit={Number(credits.monthlyDownloadLimit || 10000)}
      />

      <SectionBlock
        title="Host Results"
        count={counts.hostResults || 0}
        show={showHost}
        onToggle={() => {
          setShowHost(!showHost);
          setShowSelected(false);
        }}
        limit={hostLimit}
        onLimitChange={(v) => {
          setHostLimit(v);
          setHostPage(1);
        }}
        page={hostPage}
        totalPages={hostData.pagination?.totalPages || 1}
        onPageChange={setHostPage}
        emptyMsg="No host results found."
      >
        <div className="grid gap-3">
          {hostData.items.map((h) => (
            <label
              key={h.id}
              className={`flex items-start gap-2 ${isWaiting || showPhase2Panel ? "cursor-pointer" : ""}`}
            >
              {(isWaiting || showPhase2Panel) && (
                <input
                  type="checkbox"
                  checked={phase2Hosts.has(h.host)}
                  onChange={() => toggleP2Host(h.host)}
                  className="mt-3 rounded border-gray-600 bg-navy-800 text-cyan-500 focus:ring-cyan-500 shrink-0"
                />
              )}
              <div className="flex-1">
                <HostCard host={h} />
              </div>
            </label>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Selected Subdomain Scan Results"
        count={counts.selectedHostResults || 0}
        show={showSelected}
        onToggle={() => {
          setShowSelected(!showSelected);
          setShowHost(false);
        }}
        limit={selectedLimit}
        onLimitChange={(v) => {
          setSelectedLimit(v);
          setSelectedPage(1);
        }}
        page={selectedPage}
        totalPages={selectedData.pagination?.totalPages || 1}
        onPageChange={setSelectedPage}
        emptyMsg="No selected subdomain scan results found."
      >
        <div className="grid gap-3">
          {selectedData.items.map((h) => (
            <HostCard key={h.id} host={h} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Endpoints"
        count={counts.endpoints || 0}
        show={showEndpoints}
        onToggle={() => setShowEndpoints(!showEndpoints)}
        limit={endpointLimit}
        onLimitChange={(v) => {
          setEndpointLimit(v);
          setEndpointPage(1);
        }}
        page={endpointPage}
        totalPages={endpointData.pagination?.totalPages || 1}
        onPageChange={setEndpointPage}
        emptyMsg="No endpoints found."
      >
        <EndpointList endpoints={endpointData.items as any[]} />
      </SectionBlock>

      <SectionBlock
        title="Technologies"
        count={counts.technologies || 0}
        show={showTech}
        onToggle={() => setShowTech(!showTech)}
        limit={techLimit}
        onLimitChange={(v) => {
          setTechLimit(v);
          setTechPage(1);
        }}
        page={techPage}
        totalPages={techData.pagination?.totalPages || 1}
        onPageChange={setTechPage}
        emptyMsg="No technologies found."
      >
        <div className="flex flex-wrap gap-2">
          {techData.items.map((t) => (
            <TechCard key={String(t.id)} tech={t as any} />
          ))}
        </div>
      </SectionBlock>

      <div className="p-4 bg-navy-800/60 border border-cyan-500/10 rounded-lg">
        <p className="text-sm text-gray-400">
          CVE matching is not available on Hunter access.{" "}
          <a
            href="/regular/account"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Request an upgrade
          </a>
          .
        </p>
      </div>
    </div>
  );
}
