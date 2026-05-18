"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axios.post("/api/auth/login", {
        email,
        password,
        rememberMe,
      });
      if (data.success) {
        setSuccess("Login successful. Redirecting...");
        setTimeout(() => {
          router.push(data.redirect);
          router.refresh();
        }, 800);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Login failed";
      setError(msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-gray-600 bg-navy-800 text-cyan-500 focus:ring-cyan-500"
          />
          Remember me
        </label>
        <Link
          href="/forgot-password"
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          Forgot password?
        </Link>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
      <Button
        type="submit"
        loading={loading}
        disabled={!!success}
        className="w-full"
      >
        Sign In
      </Button>
      <p className="text-center text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-cyan-400 hover:text-cyan-300">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
