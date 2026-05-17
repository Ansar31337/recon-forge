import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import ToastContainer from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "recon-forge — Attack Surface Discovery Platform",
  description:
    "Multi-Source Passive Subdomain Intelligence and Attack Surface Discovery Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
