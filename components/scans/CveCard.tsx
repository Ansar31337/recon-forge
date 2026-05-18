import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface CveData {
  id: string;
  cveId: string;
  severity: string;
  score: number | null;
  summary: string | null;
}

interface CveCardProps {
  cve: CveData;
}

export default function CveCard({ cve }: CveCardProps) {
  const sevVariant =
    cve.severity === "critical"
      ? "red"
      : cve.severity === "high"
        ? "red"
        : cve.severity === "medium"
          ? "yellow"
          : "green";

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-cyan-400 font-mono font-semibold">
            {cve.cveId}
          </span>
          {cve.score ? (
            <span className="text-gray-400 ml-2">Score: {cve.score}</span>
          ) : null}
        </div>
        <Badge variant={sevVariant}>{cve.severity}</Badge>
      </div>
      {cve.summary ? (
        <p className="text-sm text-gray-300 mt-1">{cve.summary}</p>
      ) : null}
    </Card>
  );
}
