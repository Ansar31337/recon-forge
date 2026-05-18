import React from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface ProgressEvent {
  id: string;
  phase: string;
  message: string;
  percent: number;
  level: string;
  createdAt: string;
}

interface ProgressRibbonProps {
  events: ProgressEvent[];
}

export default function ProgressRibbon({ events }: ProgressRibbonProps) {
  if (events.length === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-cyan-400 mb-3">
        Scan Progress
      </h3>
      <div className="space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-3 text-sm">
            <Badge
              variant={
                ev.level === "error"
                  ? "red"
                  : ev.level === "warning"
                    ? "yellow"
                    : "cyan"
              }
            >
              {ev.phase}
            </Badge>
            <span className="text-gray-300">{ev.message}</span>
            <span className="text-gray-500 ml-auto">{ev.percent}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
