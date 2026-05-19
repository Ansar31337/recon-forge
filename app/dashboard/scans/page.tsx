"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { showToast } from "@/components/ui/Toast";

export default function EnterpriseScans() {
  const [scans, setScans] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteHistoryConfirm, setDeleteHistoryConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadScans = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/scans");
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

  const deleteOne = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/scans/${deleteConfirm}`);
      showToast("Scan deleted", "success");
      setDeleteConfirm(null);
      loadScans();
    } catch {
      showToast("Failed to delete scan", "error");
    } finally {
      setDeleting(false);
    }
  };

  const deleteAllHistory = async () => {
    setDeleting(true);
    try {
      await axios.delete("/api/scans/history");
      showToast("All scan history deleted", "success");
      setDeleteHistoryConfirm(false);
      loadScans();
    } catch {
      showToast("Failed to delete history", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-cyan-300">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Your Scans</h1>
        <div className="flex gap-2">
          {scans.length > 0 && (
            <Button
              variant="danger"
              className="text-sm"
              onClick={() => setDeleteHistoryConfirm(true)}
            >
              Delete All History
            </Button>
          )}
          <Link
            href="/dashboard/new-scan"
            className="px-4 py-2 bg-cyan-500 text-navy-900 font-semibold rounded-md text-sm hover:bg-cyan-400 shadow-cyan-glow transition-colors"
          >
            New Scan
          </Link>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-cyan-500/10 rounded-lg bg-navy-800/60">
          <p className="text-lg mb-2">No scans yet</p>
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
            <Card
              key={String(s.id)}
              className="hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Link
                  href={`/dashboard/scans/${s.id}`}
                  className="flex-1 min-w-0"
                >
                  <div>
                    <p className="text-gray-200 font-medium">
                      {String(s.targetValue || "Unknown")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="cyan">{String(s.inputType || "-")}</Badge>
                      <span className="text-xs text-gray-500">
                        {String(s.inputMode || "-")}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      String(s.status) === "completed"
                        ? "green"
                        : String(s.status) === "running"
                          ? "yellow"
                          : String(s.status) === "failed"
                            ? "red"
                            : "gray"
                    }
                  >
                    {String(s.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    className="text-xs px-2 py-1 text-red-400 hover:text-red-300"
                    onClick={() => setDeleteConfirm(String(s.id))}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Scan"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to delete this scan and all its results?
          </p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={deleteOne} loading={deleting}>
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteHistoryConfirm}
        onClose={() => setDeleteHistoryConfirm(false)}
        title="Delete All Scan History"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to permanently delete ALL your scans and all
            related data?
          </p>
          <p className="text-xs text-red-400">
            This action cannot be undone. All scan data, host results,
            technologies, endpoints, and CVE matches will be deleted.
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={deleteAllHistory}
              loading={deleting}
            >
              Delete All History
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDeleteHistoryConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
