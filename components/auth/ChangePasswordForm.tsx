"use client";

import React, { useState } from "react";
import axios from "axios";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (data.success) {
        showToast(data.message || "Password changed successfully", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.message || "Failed to change password");
      }
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to change password"
          : "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Current Password"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        placeholder="Enter current password"
      />
      <Input
        label="New Password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={6}
        placeholder="Minimum 6 characters"
      />
      <Input
        label="Confirm New Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={6}
        placeholder="Re-enter new password"
      />
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        loading={loading}
        disabled={loading}
      >
        Change Password
      </Button>
    </form>
  );
}
