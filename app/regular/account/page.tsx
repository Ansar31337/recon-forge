"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SupportForm from "@/components/messages/SupportForm";
import MessageThread from "@/components/messages/MessageThread";

export default function RegularAccount() {
  const [tab, setTab] = useState<"upgrade" | "support" | "messages">(
    "messages",
  );
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    setMsgLoading(true);
    try {
      const { data } = await axios.get("/api/messages");
      setMessages(data.data || []);
    } catch {
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Account</h1>

      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === "messages" ? "primary" : "secondary"}
          className="text-sm"
          onClick={() => setTab("messages")}
        >
          Messages
        </Button>
        <Button
          variant={tab === "support" ? "primary" : "secondary"}
          className="text-sm"
          onClick={() => setTab("support")}
        >
          Support
        </Button>
        <Button
          variant={tab === "upgrade" ? "primary" : "secondary"}
          className="text-sm"
          onClick={() => setTab("upgrade")}
        >
          Upgrade
        </Button>
      </div>

      {tab === "upgrade" ? (
        <Card glow>
          <h3 className="text-lg font-semibold text-cyan-300 mb-2">
            Upgrade to Enterprise
          </h3>
          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="text-gray-400 mb-2 font-medium">Hunter (Current)</p>
              <ul className="space-y-1 text-gray-300">
                <li>&#10003; Domain/Subdomain scans</li>
                <li>&#10003; Top 100 port scan</li>
                <li>&#10003; Basic technology detection</li>
                <li>&#10003; 10K monthly downloads</li>
                <li className="text-gray-500">&#10007; IP / CIDR targets</li>
                <li className="text-gray-500">&#10007; CVE matching</li>
                <li className="text-gray-500">&#10007; Top 1000 port scan</li>
              </ul>
            </div>
            <div>
              <p className="text-cyan-400 mb-2 font-medium">
                Company (Request Upgrade)
              </p>
              <ul className="space-y-1 text-gray-300">
                <li>&#10003; All target types</li>
                <li>&#10003; Top 1000 port scan</li>
                <li>&#10003; Advanced technology detection</li>
                <li>&#10003; 1M monthly downloads</li>
                <li>&#10003; IP/CIDR scanning</li>
                <li>&#10003; CVE matching</li>
              </ul>
            </div>
          </div>
          <SupportForm category="upgrade_request" onSent={loadMessages} />
        </Card>
      ) : tab === "support" ? (
        <Card glow>
          <h3 className="text-lg font-semibold text-cyan-300 mb-4">
            Send Support Message
          </h3>
          <SupportForm category="support" onSent={loadMessages} />
        </Card>
      ) : (
        <div>
          <h3 className="text-lg font-semibold text-cyan-300 mb-4">
            Your Messages
          </h3>
          <MessageThread
            messages={
              messages as {
                id: string;
                subject: string;
                body: string;
                category: string;
                status: string;
                adminReply: string | null;
                createdAt: string;
              }[]
            }
            loading={msgLoading}
          />
        </div>
      )}
    </div>
  );
}
