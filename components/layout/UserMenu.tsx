"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-300 hover:bg-navy-800 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-navy-800 border border-cyan-500/20 rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-cyan-500/15">
            <p className="text-sm text-gray-200">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <Link
            href="/change-password"
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 hover:text-cyan-300"
          >
            Change Password
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-navy-700"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
