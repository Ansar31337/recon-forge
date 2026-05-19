import React from "react";
import BasicScanForm from "@/components/scans/BasicScanForm";

export default function RegularNewScan() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">New Scan</h1>
      <BasicScanForm />
    </div>
  );
}
