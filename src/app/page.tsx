"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: number;
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
};

type DialerSession = {
  id: number;
  agentId: string;
  leadQueue: number[];
  status: "RUNNING" | "STOPPED";
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";

const buttonClass =
  "inline-flex items-center justify-center rounded-full border border-red-200 bg-white/80 px-4 py-2 text-sm text-red-900 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-red-300 hover:bg-red-50 active:scale-[0.99]";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-red-300 bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-red-400 hover:bg-red-600 active:scale-[0.99] disabled:opacity-40";

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [session, setSession] = useState<DialerSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`${API_BASE}/leads`);
      const data = (await res.json()) as Lead[];
      setLeads(data);
      setLoading(false);
    };
    load();
  }, []);

  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(leads.map((lead) => lead.id)));
  };

  const createSession = async () => {
    const res = await fetch(`${API_BASE}/dialer-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadQueue: selectedList, agentId: "agent_1" }),
    });
    const data = (await res.json()) as DialerSession;
    setSession(data);
  };

  const startSession = async () => {
    if (!session) return;
    await fetch(`${API_BASE}/dialer-sessions/${session.id}/start`, {
      method: "POST",
    });
    window.location.href = `/session/${session.id}`;
  };

  const selectionInvalid = selectedIds.size < 4 || selectedIds.size > 8;

  return (
    <div className="min-h-screen text-red-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-400">
              Lead Assessment (Advanced)
            </p>
            <h1 className="text-3xl font-semibold text-red-900">
              Lead Queue + Session
            </h1>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-red-100/60 bg-white/50 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-red-400">
                Selected leads
              </p>
              <p className="text-lg font-semibold text-red-900">
                {selectedIds.size}
              </p>
              <p className="text-xs text-red-400">Select 4-8 leads.</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-3">
              <button
                onClick={createSession}
                disabled={selectionInvalid}
                className={buttonClass}
              >
                Create Dialer Session
              </button>
              <button
                onClick={startSession}
                disabled={!session}
                className={primaryButtonClass}
              >
                Start
              </button>
            </div>
          </div>
          {selectionInvalid && (
            <p className="mt-3 text-xs text-red-400">
              Please select between 4 and 8 leads to create a session.
            </p>
          )}
          {session && (
            <p className="mt-2 text-xs text-red-400">
              Session #{session.id} ready. Press Start to begin.
            </p>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-red-100/60 bg-white/50 shadow-lg backdrop-blur-xl">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-red-50 text-left text-xs uppercase tracking-[0.2em] text-red-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === leads.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-red-300" colSpan={5}>
                    Loading leads...
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-red-100">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleOne(lead.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-red-900">
                      {lead.name || `Lead ${lead.id}`}
                    </td>
                    <td className="px-4 py-3 text-red-700">{lead.company || "-"}</td>
                    <td className="px-4 py-3 text-red-700">{lead.phone || "-"}</td>
                    <td className="px-4 py-3 text-red-700">{lead.email || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
