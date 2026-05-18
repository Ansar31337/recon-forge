"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("enterprise");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axios.post("/api/auth/signup", {
        name,
        email,
        password,
        role,
      });
      if (data.success) {
        setSuccess(data.message);
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Signup failed";
      setError(msg || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          <span className="text-2xl text-cyan-400">&#10003;</span>
        </div>
        <h3 className="text-lg font-semibold text-cyan-300">Account Created</h3>
        <p className="text-gray-300">{success}</p>
        <Button onClick={() => router.push("/login")} className="w-full">
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your full name"
        required
      />
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
        placeholder="Minimum 6 characters"
        required
        minLength={6}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300 font-medium">
          Account Type
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 bg-navy-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
        >
          <option value="enterprise">Company (Enterprise)</option>
          <option value="regular">Hunter (Regular)</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">
        Create Account
      </Button>
      <p className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
          Sign In
        </Link>
      </p>
    </form>
  );
}
