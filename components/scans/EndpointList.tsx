import React from "react";

interface EndpointData {
  id: string;
  url: string;
  path: string | null;
  statusCode: number | null;
  depth: number;
  keptByUro: boolean;
}

interface EndpointListProps {
  endpoints: EndpointData[];
}

export default function EndpointList({ endpoints }: EndpointListProps) {
  if (endpoints.length === 0) return null;

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-700/30 rounded-lg bg-navy-800/40 p-2">
      {endpoints.map((ep) => (
        <div
          key={ep.id}
          className="text-sm text-gray-300 bg-navy-800/60 px-3 py-1.5 rounded border border-gray-700/30 font-mono flex items-center gap-2"
        >
          <span className="truncate">{ep.url}</span>
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {ep.statusCode ? (
              <span className="text-xs text-gray-500">[{ep.statusCode}]</span>
            ) : null}
            {!ep.keptByUro ? (
              <span className="text-xs text-yellow-500">dropped</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
