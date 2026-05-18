import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "cyan" | "green" | "red" | "yellow" | "gray";
  className?: string;
}

export default function Badge({
  children,
  variant = "gray",
  className = "",
}: BadgeProps) {
  const variants: Record<string, string> = {
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    gray: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
