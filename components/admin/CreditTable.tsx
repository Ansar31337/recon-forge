"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

interface CreditRow {
  id: string;
  role: string;
  dailyScanLimit: number;
  maxCrawlDepth: number;
  cveEnabled: boolean;
  monthlySubdomainDownloadLimit: number;
}

interface CreditTableProps {
  credits: CreditRow[];
  loading: boolean;
  editing: string | null;
  editForm: Partial<CreditRow>;
  saveMsg: string;
  onStartEdit: (c: CreditRow) => void;
  onCancelEdit: () => void;
  onSave: (id: string) => void;
  onEditFormChange: (form: Partial<CreditRow>) => void;
}

export default function CreditTable({
  credits,
  loading,
  editing,
  editForm,
  saveMsg,
  onStartEdit,
  onCancelEdit,
  onSave,
  onEditFormChange,
}: CreditTableProps) {
  if (loading) return <div className="text-cyan-300">Loading...</div>;

  return (
    <div className="grid gap-6">
      {credits.map((c) => (
        <Card key={c.id} glow>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  c.role === "enterprise"
                    ? "green"
                    : c.role === "superadmin"
                      ? "cyan"
                      : "yellow"
                }
              >
                {c.role}
              </Badge>
            </div>
            {editing === c.id ? (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="text-xs px-3 py-1"
                  onClick={() => onSave(c.id)}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  className="text-xs px-3 py-1"
                  onClick={onCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => onStartEdit(c)}
              >
                Edit
              </Button>
            )}
          </div>
          {editing === c.id ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Daily Scan Limit"
                type="number"
                value={String(editForm.dailyScanLimit ?? 0)}
                onChange={(e) =>
                  onEditFormChange({
                    ...editForm,
                    dailyScanLimit: Number(e.target.value),
                  })
                }
              />
              <Input
                label="Max Crawl Depth"
                type="number"
                value={String(editForm.maxCrawlDepth ?? 0)}
                onChange={(e) =>
                  onEditFormChange({
                    ...editForm,
                    maxCrawlDepth: Number(e.target.value),
                  })
                }
              />
              <Input
                label="Monthly Download Limit"
                type="number"
                value={String(editForm.monthlySubdomainDownloadLimit ?? 0)}
                onChange={(e) =>
                  onEditFormChange({
                    ...editForm,
                    monthlySubdomainDownloadLimit: Number(e.target.value),
                  })
                }
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-300 font-medium">
                  CVE Enabled
                </label>
                <select
                  className="w-full px-3 py-2 bg-navy-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:border-cyan-500"
                  value={String(editForm.cveEnabled)}
                  onChange={(e) =>
                    onEditFormChange({
                      ...editForm,
                      cveEnabled: e.target.value === "true",
                    })
                  }
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Daily Scans</span>
                <p className="text-white font-semibold">{c.dailyScanLimit}</p>
              </div>
              <div>
                <span className="text-gray-400">Crawl Depth</span>
                <p className="text-white font-semibold">{c.maxCrawlDepth}</p>
              </div>
              <div>
                <span className="text-gray-400">Download Limit</span>
                <p className="text-white font-semibold">
                  {c.monthlySubdomainDownloadLimit.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-400">CVE</span>
                <p className="text-white font-semibold">
                  {c.cveEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
          )}
          {saveMsg && editing === c.id && (
            <p className="text-green-400 text-sm mt-2">{saveMsg}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
