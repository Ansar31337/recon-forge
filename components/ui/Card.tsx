import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function Card({
  children,
  className = "",
  glow = false,
}: CardProps) {
  return (
    <div
      className={`bg-navy-800/80 backdrop-blur-sm border ${glow ? "border-cyan-500/30 shadow-cyan-glow" : "border-cyan-500/10"} rounded-lg p-6 ${className}`}
    >
      {children}
    </div>
  );
}
