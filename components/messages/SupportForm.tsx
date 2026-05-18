"use client";

import React, { useState } from "react";
import axios from "axios";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface SupportFormProps {
  category: "support" | "upgrade_request";
  onSent?: () => void;
}

export default function SupportForm({ category, onSent }: SupportFormProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body) {
      setError("Subject and message are required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axios.post("/api/messages", {
        subject,
        body,
        category,
      });
      if (data.success) {
        setSuccess(data.message || "Sent!");
        setSubject("");
        setBody("");
        if (onSent) onSent();
      } else {
        setError(data.message || "Failed");
      }
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err) ? err.response?.data?.message : "Failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Brief subject"
        required
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300 font-medium">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 bg-navy-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
          placeholder={
            category === "upgrade_request"
              ? "Describe why you need Enterprise access..."
              : "Describe your issue..."
          }
          required
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
      <Button type="submit" loading={loading}>
        {category === "upgrade_request" ? "Request Upgrade" : "Send Message"}
      </Button>
    </form>
  );
}
