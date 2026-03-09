"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: number;
  name?: string;
  phone?: string;
  company?: string;
  email?: string;
};

type Call = {
  id: number;
  leadId: number;
  sessionId: number;
  status: string;
  startedAt: string;
  endedAt: string | null;
  providerCallId: string;
};

type DialerSession = {
  id: number;
  agentId: string;
  leadQueue: number[];
  activeCallIds: number[];
  winnerCallId: number | null;
  status: "RUNNING" | "STOPPED";
  metrics: { attempted: number; connected: number; failed: number; canceled: number };
};

type CRMActivity = {
  id: number;
  leadId: number;
  callId: number;
  disposition: string;
  createdAt: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";

const buttonClass =
  "inline-flex items-center justify-center rounded-full border border-red-200 bg-white/80 px-4 py-2 text-sm text-red-900 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-red-300 hover:bg-red-50 active:scale-[0.99]";

export default function SessionPage() {
  const params = useParams();
  const sessionId = Number(params.id);

  const [session, setSession] = useState<DialerSession | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const loadLeads = async () => {
      const res = await fetch(`${API_BASE}/leads`);
      const data = (await res.json()) as Lead[];
      setLeads(data);
    };
    loadLeads();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      const [sessionRes, callsRes, activitiesRes] = await Promise.all([
        fetch(`${API_BASE}/dialer-sessions/${sessionId}`),
        fetch(`${API_BASE}/calls?sessionId=${sessionId}`),
        fetch(`${API_BASE}/mock-crm/activities`),
      ]);
      if (sessionRes.ok) setSession((await sessionRes.json()) as DialerSession);
      if (callsRes.ok) setCalls((await callsRes.json()) as Call[]);
      if (activitiesRes.ok) setActivities((await activitiesRes.json()) as CRMActivity[]);
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [sessionId]);

  const leadMap = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const activityMap = useMemo(
    () => new Map(activities.map((a) => [a.callId, a])),
    [activities]
  );

  const activeCalls = session?.activeCallIds
    ? session.activeCallIds
        .map((id) => calls.find((call) => call.id === id))
        .filter(Boolean) as Call[]
    : [];

  const winnerCall = session?.winnerCallId
    ? calls.find((call) => call.id === session.winnerCallId)
    : null;

  return (
    <div className="min-h-screen text-red-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-400">
              Dialer Session
            </p>
            <h1 className="text-3xl font-semibold text-red-900">
              Session #{sessionId}
            </h1>
          </div>
          <Link href="/" className={buttonClass}>
            Back to list
          </Link>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-red-100/60 bg-white/50 p-4 shadow-lg backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-red-400">Status</p>
            <p className="text-lg font-semibold text-red-900">
              {session?.status ?? "Loading"}
            </p>
          </div>
          <div className="rounded-2xl border border-red-100/60 bg-white/50 p-4 shadow-lg backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-red-400">Attempted</p>
            <p className="text-lg font-semibold text-red-900">
              {session?.metrics.attempted ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-red-100/60 bg-white/50 p-4 shadow-lg backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-red-400">Connected</p>
            <p className="text-lg font-semibold text-red-900">
              {session?.metrics.connected ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-red-100/60 bg-white/50 p-4 shadow-lg backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-red-400">Failed</p>
            <p className="text-lg font-semibold text-red-900">
              {(session?.metrics.failed ?? 0) + (session?.metrics.canceled ?? 0)}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-red-100/60 bg-white/50 p-6 shadow-lg backdrop-blur-xl">
            <h2 className="text-sm uppercase tracking-[0.2em] text-red-400">
              Active lines
            </h2>
            <div className="mt-4 grid gap-3">
              {activeCalls.length === 0 && (
                <p className="text-sm text-red-400">No active calls.</p>
              )}
              {activeCalls.map((call) => {
                const lead = leadMap.get(call.leadId);
                return (
                  <div
                    key={call.id}
                    className="rounded-xl border border-red-100/60 bg-white/50 p-4 shadow-md backdrop-blur-lg"
                  >
                    <p className="text-sm font-semibold text-red-900">
                      {lead?.name ?? `Lead ${call.leadId}`}
                    </p>
                    <p className="text-xs text-red-500">{lead?.phone ?? "-"}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-red-400">
                      {call.status}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-red-100/60 bg-white/50 p-6 shadow-lg backdrop-blur-xl">
            <h2 className="text-sm uppercase tracking-[0.2em] text-red-400">
              Winner call
            </h2>
            {winnerCall ? (
              <div className="mt-4 rounded-xl border border-yellow-300/70 bg-white/60 p-4 shadow-md backdrop-blur-lg">
                <p className="text-sm font-semibold text-red-900">
                  {leadMap.get(winnerCall.leadId)?.name ?? `Lead ${winnerCall.leadId}`}
                </p>
                <p className="text-xs text-red-600">{winnerCall.status}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-red-400">No winner yet.</p>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-red-100/60 bg-white/50 p-6 shadow-lg backdrop-blur-xl">
          <h2 className="text-sm uppercase tracking-[0.2em] text-red-400">
            CRM activity status
          </h2>
          <div className="mt-4 grid gap-3">
            {calls.map((call) => {
              const activity = activityMap.get(call.id);
              return (
                <div
                  key={call.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100/60 bg-white/50 p-4 shadow-md backdrop-blur-lg"
                >
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      {leadMap.get(call.leadId)?.name ?? `Lead ${call.leadId}`}
                    </p>
                    <p className="text-xs text-red-400">Call #{call.id}</p>
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-red-400">
                    {call.status}
                  </div>
                  <div className="text-xs text-red-600">
                    {activity ? "CRM synced" : "Pending"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
