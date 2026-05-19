"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axios.post("/api/auth/change-password", {
        oldPassword,
        newPassword,
      });
      if (data.success) {
        setSuccess(data.message);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.message || "Failed");
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed";
      setError(msg || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0e1a]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-cyan-400 font-mono font-bold text-2xl tracking-wider">
            recon-forge
          </h1>
          <p className="text-gray-400 text-sm mt-1">Change your password</p>
        </div>
        <div className="bg-navy-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
          {success ? (
            <div className="text-center space-y-3">
              <p className="text-green-400">{success}</p>
              <p className="text-gray-400 text-sm">Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Current Password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current password"
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" loading={loading} className="w-full">
                Change Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
