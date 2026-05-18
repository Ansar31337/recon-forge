"use client";

import React, { useState } from "react";
import axios from "axios";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddUserModal({
  open,
  onClose,
  onCreated,
}: AddUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("regular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      setError("All fields required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/admin/users", { name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("regular");
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err) ? err.response?.data?.message : "Failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New User">
      <div className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300 font-medium">Role</label>
          <select
            className="w-full px-3 py-2 bg-navy-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:border-cyan-500"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="regular">Regular</option>
            <option value="enterprise">Enterprise</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button onClick={handleSubmit} loading={loading} className="w-full">
          Create User
        </Button>
      </div>
    </Modal>
  );
}
