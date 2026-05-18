"use client";

import React from "react";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UserTableProps {
  users: UserRow[];
  loading: boolean;
  onToggleActive: (user: UserRow) => void;
  onChangeRole: (user: UserRow, role: string) => void;
  onResetPassword: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}

export default function UserTable({
  users,
  loading,
  onToggleActive,
  onChangeRole,
  onResetPassword,
  onDelete,
}: UserTableProps) {
  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (v: unknown) => (
        <Badge
          variant={
            String(v) === "superadmin"
              ? "cyan"
              : String(v) === "enterprise"
                ? "green"
                : "yellow"
          }
        >
          {String(v)}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (v: unknown) =>
        v ? (
          <Badge variant="green">Active</Badge>
        ) : (
          <Badge variant="red">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_v: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            className="text-xs px-2 py-1"
            onClick={() => onToggleActive(row as unknown as UserRow)}
          >
            {row.isActive ? "Deactivate" : "Activate"}
          </Button>
          <select
            className="text-xs bg-navy-800 border border-gray-600 rounded px-1 py-1 text-gray-200"
            value={String(row.role)}
            onChange={(e) =>
              onChangeRole(row as unknown as UserRow, e.target.value)
            }
          >
            <option value="regular">Regular</option>
            <option value="enterprise">Enterprise</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <Button
            variant="ghost"
            className="text-xs px-2 py-1"
            onClick={() => onResetPassword(row as unknown as UserRow)}
          >
            Reset PW
          </Button>
          <Button
            variant="danger"
            className="text-xs px-2 py-1"
            onClick={() => onDelete(row as unknown as UserRow)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-cyan-300">Loading...</div>;

  return (
    <Table
      columns={columns}
      data={users as unknown as Record<string, unknown>[]}
      emptyMessage="No users found"
    />
  );
}
