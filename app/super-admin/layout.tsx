import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="superadmin" />
      <div className="flex-1 flex flex-col">
        <TopBar role="superadmin" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
