import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  loading,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-40 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary: "bg-cyan-500 hover:bg-cyan-600 text-navy-900 shadow-cyan-glow",
    secondary:
      "border border-cyan-500/40 bg-transparent text-cyan-400 hover:bg-cyan-500/10",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent text-cyan-400 hover:text-cyan-300 hover:bg-white/5",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
