"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import CreditTable from "@/components/admin/CreditTable";

interface CreditRow {
  id: string;
  role: string;
  dailyScanLimit: number;
  maxCrawlDepth: number;
  cveEnabled: boolean;
  monthlySubdomainDownloadLimit: number;
}

export default function SuperAdminCredits() {
  const [credits, setCredits] = useState<CreditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreditRow>>({});
  const [saveMsg, setSaveMsg] = useState("");

  const loadCredits = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/credits");
      setCredits(data.data || []);
    } catch {
      setError("Failed to load credits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const startEdit = (c: CreditRow) => {
    setEditing(c.id);
    setEditForm({
      dailyScanLimit: c.dailyScanLimit,
      maxCrawlDepth: c.maxCrawlDepth,
      cveEnabled: c.cveEnabled,
      monthlySubdomainDownloadLimit: c.monthlySubdomainDownloadLimit,
    });
    setSaveMsg("");
  };

  const saveCredit = async (id: string) => {
    try {
      await axios.patch("/api/admin/credits", { id, ...editForm });
      setSaveMsg("Saved");
      setEditing(null);
      loadCredits();
    } catch {
      setSaveMsg("Error saving");
    }
  };

  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Credit Limits</h1>
      <CreditTable
        credits={credits}
        loading={loading}
        editing={editing}
        editForm={editForm}
        saveMsg={saveMsg}
        onStartEdit={startEdit}
        onCancelEdit={() => setEditing(null)}
        onSave={saveCredit}
        onEditFormChange={setEditForm}
      />
    </div>
  );
}
