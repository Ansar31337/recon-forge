"use client";

import React, { useState } from "react";
import axios from "axios";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/auth/forgot-password", {
        email,
        message,
      });
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "Request failed");
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Request failed";
      setError(msg || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold text-cyan-300">
          Request Submitted
        </h3>
        <p className="text-gray-300">
          Your password reset request has been submitted. Please contact the
          superadmin to complete the reset.
        </p>
        <Link
          href="/login"
          className="inline-block text-cyan-400 hover:text-cyan-300"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        error={error && !message ? error : undefined}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300 font-medium">
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 bg-navy-800 border rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 resize-none transition-colors ${error && message ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-gray-700"}`}
          placeholder="Describe your issue..."
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">
        Submit Request
      </Button>
      <p className="text-center text-sm text-gray-400">
        Remember your password?{" "}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
          Sign In
        </Link>
      </p>
    </form>
  );
}
