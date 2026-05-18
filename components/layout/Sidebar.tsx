"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const superAdminLinks: NavItem[] = [
  { label: "Dashboard", href: "/super-admin", icon: "◇" },
  { label: "Users", href: "/super-admin/users", icon: "◆" },
  { label: "Credits", href: "/super-admin/credits", icon: "◎" },
  { label: "Scans", href: "/super-admin/scans", icon: "◉" },
  { label: "Messages", href: "/super-admin/messages", icon: "◈" },
  { label: "Password Reset", href: "/super-admin/password-reset", icon: "⬡" },
];

const enterpriseLinks: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "◇" },
  { label: "New Scan", href: "/dashboard/new-scan", icon: "◉" },
  { label: "Scans", href: "/dashboard/scans", icon: "◎" },
  { label: "Credits", href: "/dashboard/credits", icon: "◆" },
  { label: "Support", href: "/dashboard/support", icon: "◈" },
];

const regularLinks: NavItem[] = [
  { label: "Dashboard", href: "/regular", icon: "◇" },
  { label: "New Scan", href: "/regular/new-scan", icon: "◉" },
  { label: "Scans", href: "/regular/scans", icon: "◎" },
  { label: "Credits", href: "/regular/credits", icon: "◆" },
  { label: "Account", href: "/regular/account", icon: "◈" },
];

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const links =
    role === "superadmin"
      ? superAdminLinks
      : role === "enterprise"
        ? enterpriseLinks
        : regularLinks;

  return (
    <aside className="w-56 min-h-screen bg-navy-900/95 border-r border-cyan-500/15 flex flex-col">
      <div className="p-4 border-b border-cyan-500/15">
        <Link
          href={
            role === "superadmin"
              ? "/super-admin"
              : role === "enterprise"
                ? "/dashboard"
                : "/regular"
          }
        >
          <h1 className="text-cyan-400 font-bold text-lg tracking-wider font-mono">
            recon-forge
          </h1>
        </Link>
        <p className="text-gray-500 text-xs mt-1">
          {role === "superadmin"
            ? "Admin Panel"
            : role === "enterprise"
              ? "Company"
              : "Hunter"}
        </p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !==
              `/${role === "superadmin" ? "super-admin" : role === "enterprise" ? "dashboard" : "regular"}` &&
              pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-navy-800"
              }`}
            >
              <span className="text-xs">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
