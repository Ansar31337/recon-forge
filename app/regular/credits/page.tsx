"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "@/components/ui/Card";

export default function RegularCredits() {
  const [credits, setCredits] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/api/credits/me")
      .then(({ data }) => {
        setCredits(data.data || {});
      })
      .catch(() => setError("Failed to load credits"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-cyan-300">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Credits & Usage</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card glow>
          <p className="text-sm text-gray-400">Daily Scan Usage</p>
          <p className="text-3xl font-bold text-cyan-400 mt-1">
            {String(credits.dailyScanUsed || 0)}{" "}
            <span className="text-lg text-gray-500">
              / {String(credits.dailyScanLimit || 5)}
            </span>
          </p>
          <div className="mt-2 h-2 bg-navy-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{
                width: `${Math.min(100, (Number(credits.dailyScanUsed || 0) / Number(credits.dailyScanLimit || 1)) * 100)}%`,
              }}
            />
          </div>
        </Card>
        <Card glow>
          <p className="text-sm text-gray-400">Monthly Downloads</p>
          <p className="text-3xl font-bold text-cyan-400 mt-1">
            {Number(credits.monthlyDownloadUsed || 0).toLocaleString()}{" "}
            <span className="text-lg text-gray-500">
              / {Number(credits.monthlyDownloadLimit || 10000).toLocaleString()}
            </span>
          </p>
          <div className="mt-2 h-2 bg-navy-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{
                width: `${Math.min(100, (Number(credits.monthlyDownloadUsed || 0) / Number(credits.monthlyDownloadLimit || 1)) * 100)}%`,
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
