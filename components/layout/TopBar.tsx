"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Badge from "@/components/ui/Badge";
import { UserMenu } from "./UserMenu";

interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TopBar({ role }: { role: string }) {
  const [user, setUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then((r) => {
        if (r.data.success) setUser(r.data.data);
      })
      .catch(() => {});
  }, []);

  const roleVariant =
    role === "superadmin"
      ? ("cyan" as const)
      : role === "enterprise"
        ? ("green" as const)
        : ("yellow" as const);
  const roleLabel =
    role === "superadmin"
      ? "Superadmin"
      : role === "enterprise"
        ? "Enterprise"
        : "Regular";

  return (
    <header className="h-14 bg-navy-900/90 border-b border-cyan-500/15 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Badge variant={roleVariant}>{roleLabel}</Badge>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-gray-300 text-sm hidden sm:inline">
              {user.name}
            </span>
            <UserMenu user={user} />
          </>
        )}
      </div>
    </header>
  );
}
