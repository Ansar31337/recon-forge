"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface MessageItem {
  id: string;
  subject: string;
  body: string;
  category: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
}

interface MessageThreadProps {
  messages: MessageItem[];
  loading: boolean;
  emptyMessage?: string;
}

export default function MessageThread({
  messages,
  loading,
  emptyMessage = "No messages yet",
}: MessageThreadProps) {
  if (loading) return <div className="text-cyan-300">Loading...</div>;

  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 border border-gray-700/50 rounded-lg">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <Card key={m.id}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-gray-200 font-medium">{m.subject}</h4>
              <Badge
                variant={m.category === "upgrade_request" ? "yellow" : "cyan"}
              >
                {m.category === "upgrade_request" ? "Upgrade" : "Support"}
              </Badge>
            </div>
            <Badge
              variant={
                m.status === "replied"
                  ? "green"
                  : m.status === "open"
                    ? "yellow"
                    : "gray"
              }
            >
              {m.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{m.body}</p>
          {m.adminReply ? (
            <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
              <p className="text-xs text-cyan-400 mb-1">Admin Reply</p>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">
                {m.adminReply}
              </p>
            </div>
          ) : null}
          <p className="text-xs text-gray-500 mt-2">
            {new Date(m.createdAt).toLocaleString()}
          </p>
        </Card>
      ))}
    </div>
  );
}
