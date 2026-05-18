import React from "react";
import Badge from "@/components/ui/Badge";

interface WafBadgeProps {
  wafName: string | null;
}

export default function WafBadge({ wafName }: WafBadgeProps) {
  if (!wafName) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">WAF/CDN:</span>
      <Badge variant="yellow">{wafName}</Badge>
    </div>
  );
}
