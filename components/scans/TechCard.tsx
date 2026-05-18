import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface TechData {
  id: string;
  name: string;
  version: string | null;
  source: string;
  confidence: number | null;
}

interface TechCardProps {
  tech: TechData;
}

export default function TechCard({ tech }: TechCardProps) {
  return (
    <Card className="py-2 px-3 inline-block">
      <span className="text-sm text-cyan-300 font-mono">{tech.name}</span>
      {tech.version ? (
        <span className="text-xs text-gray-400 ml-1">v{tech.version}</span>
      ) : null}
      <Badge variant="gray" className="ml-2">
        {tech.source}
      </Badge>
    </Card>
  );
}
