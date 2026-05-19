"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "@/components/ui/Card";
import { useRouter } from "next/navigation";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  enterpriseUsers: number;
  regularUsers: number;
  totalScans: number;
  runningScans: number;
  completedScans: number;
  failedScans: number;
  openMessages: number;
  upgradeRequests: number;
  pendingPasswordResets: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then((r) => {
        if (!r.data.success || r.data.data.role !== "superadmin") {
          router.push("/login");
          return;
        }
      })
      .catch(() => router.push("/login"));

    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/stats");
      setStats(data.data);
    } catch {
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-cyan-400" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="ml-3 text-cyan-300 text-sm">Loading dashboard...</span>
      </div>
    );
  if (error)
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-2">{error}</p>
        <button
          onClick={loadStats}
          className="text-cyan-400 text-sm hover:text-cyan-300"
        >
          Retry
        </button>
      </div>
    );
  if (!stats) return null;

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, color: "text-cyan-400" },
    {
      label: "Active Users",
      value: stats.activeUsers,
      color: "text-green-400",
    },
    {
      label: "Pending Users",
      value: stats.pendingUsers,
      color: "text-yellow-400",
    },
    {
      label: "Enterprise",
      value: stats.enterpriseUsers,
      color: "text-cyan-300",
    },
    { label: "Regular", value: stats.regularUsers, color: "text-green-300" },
    { label: "Total Scans", value: stats.totalScans, color: "text-cyan-400" },
    { label: "Running", value: stats.runningScans, color: "text-yellow-400" },
    {
      label: "Completed",
      value: stats.completedScans,
      color: "text-green-400",
    },
    { label: "Failed", value: stats.failedScans, color: "text-red-400" },
    {
      label: "Open Messages",
      value: stats.openMessages,
      color: "text-cyan-400",
    },
    {
      label: "Upgrade Requests",
      value: stats.upgradeRequests,
      color: "text-yellow-400",
    },
    {
      label: "Password Resets",
      value: stats.pendingPasswordResets,
      color: "text-yellow-400",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} glow>
            <p className="text-sm text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
