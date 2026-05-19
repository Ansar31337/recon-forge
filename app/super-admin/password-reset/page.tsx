"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

interface ResetReq {
  id: string;
  email: string;
  status: string;
  message: string | null;
  adminNote: string | null;
  createdAt: string;
}

export default function SuperAdminPasswordReset() {
  const [requests, setRequests] = useState<ResetReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<ResetReq | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [formError, setFormError] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/password-reset-requests");
      setRequests(data.data || []);
    } catch {
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = (req: ResetReq) => {
    setSelectedReq(req);
    setNewPassword("");
    setAdminNote("");
    setFormError("");
    setActionOpen(true);
  };

  const handleReject = async (req: ResetReq) => {
    await axios.patch(`/api/admin/password-reset-requests/${req.id}`, {
      status: "rejected",
      adminNote: "Rejected",
    });
    loadRequests();
  };

  const completeReset = async () => {
    if (!selectedReq) return;
    if (!newPassword || newPassword.length < 6) {
      setFormError("Password must be 6+ characters");
      return;
    }
    try {
      await axios.patch(
        `/api/admin/password-reset-requests/${selectedReq.id}`,
        {
          status: "completed",
          adminNote: adminNote || "Password reset completed",
          newPassword,
        },
      );
      setActionOpen(false);
      loadRequests();
    } catch (err: unknown) {
      setFormError(
        axios.isAxiosError(err) ? err.response?.data?.message : "Failed",
      );
    }
  };

  const columns = [
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (v: unknown) => {
        const s = String(v);
        return (
          <Badge
            variant={
              s === "pending"
                ? "yellow"
                : s === "completed"
                  ? "green"
                  : s === "rejected"
                    ? "red"
                    : "gray"
            }
          >
            {s}
          </Badge>
        );
      },
    },
    {
      key: "message",
      label: "Message",
      render: (v: unknown) => (v ? String(v).slice(0, 50) : "-"),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (v: unknown) => new Date(v as string).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_v: unknown, row: Record<string, unknown>) =>
        String(row.status) === "pending" ? (
          <div className="flex gap-1">
            <Button
              variant="primary"
              className="text-xs px-2 py-1"
              onClick={() => handleApprove(row as unknown as ResetReq)}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              className="text-xs px-2 py-1"
              onClick={() => handleReject(row as unknown as ResetReq)}
            >
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  if (loading) return <div className="text-cyan-300">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        Password Reset Requests
      </h1>
      <Table
        columns={columns}
        data={requests as unknown as Record<string, unknown>[]}
        emptyMessage="No requests"
      />

      <Modal
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        title={`Reset Password — ${selectedReq?.email}`}
      >
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300 font-medium">
              Admin Note (optional)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-navy-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <Button onClick={completeReset} className="w-full">
            Complete Reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}
