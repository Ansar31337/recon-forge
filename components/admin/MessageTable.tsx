"use client";

import React from "react";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface MessageRow {
  id: string;
  fromUser: { name: string; email: string; role: string } | null;
  category: string;
  subject: string;
  body: string;
  adminReply: string | null;
  status: string;
  createdAt: string;
}

interface MessageTableProps {
  messages: MessageRow[];
  loading: boolean;
  onReply: (msg: MessageRow) => void;
}

export default function MessageTable({
  messages,
  loading,
  onReply,
}: MessageTableProps) {
  const columns = [
    {
      key: "fromUser.name",
      label: "From",
      render: (_v: unknown, row: Record<string, unknown>) => {
        const u = (row as unknown as MessageRow).fromUser;
        return <span>{u?.name || "-"}</span>;
      },
    },
    {
      key: "category",
      label: "Category",
      render: (v: unknown) => (
        <Badge variant={String(v) === "upgrade_request" ? "yellow" : "cyan"}>
          {String(v)}
        </Badge>
      ),
    },
    { key: "subject", label: "Subject" },
    {
      key: "status",
      label: "Status",
      render: (v: unknown) => {
        const s = String(v);
        return (
          <Badge
            variant={
              s === "open" ? "yellow" : s === "replied" ? "green" : "gray"
            }
          >
            {s}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      label: "Date",
      render: (v: unknown) => new Date(v as string).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_v: unknown, row: Record<string, unknown>) => (
        <Button
          variant="ghost"
          className="text-xs px-2 py-1"
          onClick={() => onReply(row as unknown as MessageRow)}
        >
          {String(row.status) === "open" ? "Reply" : "View"}
        </Button>
      ),
    },
  ];

  if (loading) return <div className="text-cyan-300">Loading...</div>;

  return (
    <Table
      columns={columns}
      data={messages as unknown as Record<string, unknown>[]}
      emptyMessage="No messages yet"
    />
  );
}
