import React from "react";
import ScanForm from "@/components/scans/ScanForm";

export default function EnterpriseNewScan() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">New Scan</h1>
      <ScanForm />
    </div>
  );
}
