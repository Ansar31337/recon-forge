"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import UserTable from "@/components/admin/UserTable";
import AddUserModal from "@/components/admin/AddUserModal";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/users");
      setUsers(data.data || []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleActive = async (user: UserRow) => {
    await axios.patch(`/api/admin/users/${user.id}`, {
      isActive: !user.isActive,
    });
    loadUsers();
  };

  const changeRole = async (user: UserRow, role: string) => {
    await axios.patch(`/api/admin/users/${user.id}`, { role });
    loadUsers();
  };

  const confirmDelete = (user: UserRow) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/users/${userToDelete.id}`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch {
      setFormError("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      setFormError("Password must be 6+ chars");
      return;
    }
    try {
      await axios.post(`/api/admin/users/${selectedUser.id}/reset-password`, {
        newPassword,
      });
      setResetOpen(false);
      setNewPassword("");
      setFormError("");
      setSelectedUser(null);
    } catch (err: unknown) {
      setFormError(
        axios.isAxiosError(err) ? err.response?.data?.message : "Failed",
      );
    }
  };

  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <Button onClick={() => setAddOpen(true)}>Add User</Button>
      </div>

      <UserTable
        users={users}
        loading={loading}
        onToggleActive={toggleActive}
        onChangeRole={changeRole}
        onResetPassword={(user) => {
          setSelectedUser(user);
          setNewPassword("");
          setFormError("");
          setResetOpen(true);
        }}
        onDelete={confirmDelete}
      />

      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={loadUsers}
      />

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={`Reset Password — ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <Button onClick={handleReset} className="w-full">
            Reset Password
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to permanently delete{" "}
            <span className="text-red-400 font-semibold">
              {userToDelete?.name}
            </span>{" "}
            ({userToDelete?.email})?
          </p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete Permanently
            </Button>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
