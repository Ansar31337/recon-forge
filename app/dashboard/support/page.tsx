"use client";

import React from "react";
import Card from "@/components/ui/Card";
import SupportForm from "@/components/messages/SupportForm";

export default function EnterpriseSupport() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Support</h1>
      <Card glow>
        <h3 className="text-lg font-semibold text-cyan-300 mb-4">
          Send Support Message
        </h3>
        <SupportForm category="support" />
      </Card>
    </div>
  );
}
