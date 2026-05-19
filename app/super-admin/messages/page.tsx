"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import MessageTable from "@/components/admin/MessageTable";

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

export default function SuperAdminMessages() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<MessageRow | null>(null);
  const [reply, setReply] = useState("");
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/messages");
      setMessages(data.data || []);
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const sendReply = async () => {
    if (!selectedMsg || !reply.trim()) {
      setFormError("Reply is required");
      return;
    }
    setSending(true);
    try {
      await axios.post(`/api/admin/messages/${selectedMsg.id}/reply`, {
        reply,
      });
      setReplyOpen(false);
      setReply("");
      setFormError("");
      loadMessages();
    } catch (err: unknown) {
      setFormError(
        axios.isAxiosError(err) ? err.response?.data?.message : "Failed",
      );
    } finally {
      setSending(false);
    }
  };

  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>
      <MessageTable
        messages={messages}
        loading={loading}
        onReply={(msg) => {
          setSelectedMsg(msg);
          setReply("");
          setFormError("");
          setReplyOpen(true);
        }}
      />

      <Modal
        open={replyOpen}
        onClose={() => setReplyOpen(false)}
        title={selectedMsg ? selectedMsg.subject : "Reply"}
      >
        {selectedMsg && (
          <div className="space-y-4">
            <div className="text-sm">
              <p className="text-gray-400">
                From: {selectedMsg.fromUser?.name} (
                {selectedMsg.fromUser?.email})
              </p>
              <p className="text-gray-400">Category: {selectedMsg.category}</p>
              <p className="text-gray-200 mt-2 whitespace-pre-wrap">
                {selectedMsg.body}
              </p>
              {selectedMsg.adminReply && (
                <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
                  <p className="text-xs text-cyan-400 mb-1">Admin Reply</p>
                  <p className="text-gray-200 text-sm whitespace-pre-wrap">
                    {selectedMsg.adminReply}
                  </p>
                </div>
              )}
            </div>
            {selectedMsg.status === "open" && (
              <>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-navy-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Write your reply..."
                />
                {formError && (
                  <p className="text-sm text-red-400">{formError}</p>
                )}
                <Button
                  onClick={sendReply}
                  loading={sending}
                  className="w-full"
                >
                  Send Reply
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
