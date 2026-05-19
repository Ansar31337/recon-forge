"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

export default function EnterpriseDashboard() {
  const [scans, setScans] = useState<Record<string, unknown>[]>([]);
  const [credits, setCredits] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([axios.get("/api/scans"), axios.get("/api/credits/me")])
      .then(([scansRes, creditsRes]) => {
        setScans((scansRes.data.data || []).slice(0, 5));
        setCredits(creditsRes.data.data || {});
      })
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-cyan-300">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Company Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card glow>
          <p className="text-sm text-gray-400">Daily Scans</p>
          <p className="text-2xl font-bold text-cyan-400">
            {String(credits.dailyScanUsed || 0)} /{" "}
            {String(credits.dailyScanLimit || 20)}
          </p>
        </Card>
        <Card glow>
          <p className="text-sm text-gray-400">Monthly Downloads</p>
          <p className="text-2xl font-bold text-cyan-400">
            {Number(credits.monthlyDownloadUsed || 0).toLocaleString()} /{" "}
            {Number(credits.monthlyDownloadLimit || 1000000).toLocaleString()}
          </p>
        </Card>
        <Card glow>
          <p className="text-sm text-gray-400">CVE Access</p>
          <p className="text-2xl font-bold text-green-400">Enabled</p>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
        <Link
          href="/dashboard/scans"
          className="text-cyan-400 text-sm hover:text-cyan-300"
        >
          View All
        </Link>
      </div>
      {scans.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border border-cyan-500/10 rounded-lg bg-navy-800/40">
          No scans yet.{" "}
          <Link
            href="/dashboard/new-scan"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Create your first scan
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {scans.map((s) => (
            <Link key={String(s.id)} href={`/dashboard/scans/${s.id}`}>
              <Card className="hover:border-cyan-500/30 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-200 font-medium">
                      {String(s.targetValue || "Unknown")}
                    </p>
                    <p className="text-sm text-gray-400">
                      {String(s.inputType || "-")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      String(s.status) === "completed"
                        ? "green"
                        : String(s.status) === "running"
                          ? "yellow"
                          : "gray"
                    }
                  >
                    {String(s.status)}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
