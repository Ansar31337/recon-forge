"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function SuperAdminScans() {
  const [scans, setScans] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadScans = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/scans");
      setScans(data.data || []);
    } catch {
      setError("Failed to load scans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const cancelScan = async (id: string) => {
    if (!confirm("Cancel this scan?")) return;
    await axios.post(`/api/admin/scans/${id}/cancel`);
    loadScans();
  };

  const columns = [
    {
      key: "user",
      uid: "user_email",
      label: "Owner",
      render: (v: unknown) => {
        const u = v as { name?: string; email?: string; role?: string } | null;
        if (!u) return <span className="text-gray-500">-</span>;
        return (
          <div className="flex flex-col">
            <span className="text-gray-200 text-xs">{u.email}</span>
            <span className="text-gray-500 text-xs">{u.name}</span>
          </div>
        );
      },
    },
    {
      key: "user",
      uid: "user_role",
      label: "Role",
      render: (v: unknown) => {
        const u = v as { role?: string } | null;
        const role = u?.role || "unknown";
        const variant =
          role === "enterprise"
            ? "cyan"
            : role === "regular"
              ? "green"
              : role === "superadmin"
                ? "yellow"
                : "gray";
        return <Badge variant={variant}>{role}</Badge>;
      },
    },
    { key: "targetValue", label: "Target" },
    {
      key: "inputType",
      label: "Type",
      render: (v: unknown) => <Badge variant="cyan">{String(v)}</Badge>,
    },
    {
      key: "inputMode",
      label: "Mode",
      render: (v: unknown) => String(v || "-"),
    },
    {
      key: "status",
      label: "Status",
      render: (v: unknown) => {
        const s = String(v);
        const variant =
          s === "completed"
            ? "green"
            : s === "running"
              ? "yellow"
              : s === "failed"
                ? "red"
                : "gray";
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Created",
      render: (v: unknown) => new Date(v as string).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_v: unknown, row: Record<string, unknown>) =>
        row.status === "running" ? (
          <Button
            variant="danger"
            className="text-xs px-2 py-1"
            onClick={() => cancelScan(String(row.id))}
          >
            Cancel
          </Button>
        ) : null,
    },
  ];

  if (loading) return <div className="text-cyan-300">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">All Scans</h1>
      <Table columns={columns} data={scans} emptyMessage="No scans yet" />
    </div>
  );
}
