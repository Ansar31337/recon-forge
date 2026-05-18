import React from "react";

interface Column {
  key: string;
  label: string;
  uid?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
}

export default function Table({
  columns,
  data,
  emptyMessage = "No data available",
}: TableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 border border-gray-700/50 rounded-lg bg-navy-800/60">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-700/50 rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-navy-800 text-gray-300 border-b border-gray-700/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.uid || col.key}
                className="px-4 py-3 font-medium whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-gray-700/30 hover:bg-navy-800/50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.uid || col.key}
                  className="px-4 py-3 text-gray-200 whitespace-nowrap"
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
