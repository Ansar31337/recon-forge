"use client";

import React, { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClass?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = "max-w-md",
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`relative bg-navy-700 border border-gray-700/50 rounded-lg p-6 ${widthClass} max-h-[90vh] overflow-y-auto shadow-cyan-glow-lg`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-cyan-300">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
