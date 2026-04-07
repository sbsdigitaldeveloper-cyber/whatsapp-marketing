"use client";

import { useState, useEffect } from "react";

interface Agent {
  id:        number;
  name:      string;
  email:     string;
  createdAt: string;
  _count:    { contacts: number };
}

export default function AgentsPage() {
  const [agents, setAgents]       = useState<Agent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [deleting, setDeleting]   = useState<number | null>(null);
  const [error, setError]         = useState<string | null>(null);

  // Form state
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [creating, setCreating]   = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function fetchAgents() {
    try {
      const res  = await fetch("/api/agents");
      const data = await res.json();
      if (res.ok) setAgents(data.agents ?? []);
      else setError(data.error);
    } catch {
      setError("Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAgents(); }, []);

  async function handleCreate() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("All fields are required");
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const res  = await fetch("/api/agents", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create agent");
      setName(""); setEmail(""); setPassword("");
      setShowForm(false);
      fetchAgents();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this agent? Their contacts will be unassigned.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchAgents();
    } catch {
      setError("Failed to delete agent");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agents</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your team — agents can reply to their assigned contacts
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(null); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          <span>New Agent</span>
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Create new agent</h2>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-medium mb-1 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-colors placeholder:text-slate-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-medium mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-colors placeholder:text-slate-400"
              />
            </div>

            {formError && (
              <p className="text-xs text-red-500 font-mono">⚠ {formError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-200 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  "Create Agent"
                )}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
          ⚠ {error}
        </div>
      )}

      {/* Agents List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <span className="text-5xl">👤</span>
          <p className="text-sm">No agents yet — create your first one above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm hover:border-slate-300 transition-colors"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 flex-shrink-0">
                {agent.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{agent.name}</p>
                <p className="text-xs text-slate-400 font-mono truncate">{agent.email}</p>
              </div>

              {/* Contact count badge */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex-shrink-0">
                <span className="text-xs">💬</span>
                <span className="text-xs font-medium text-slate-600">
                  {agent._count.contacts} contact{agent._count.contacts !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Joined date */}
              <p className="text-[11px] text-slate-400 font-mono flex-shrink-0 hidden sm:block">
                {new Date(agent.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </p>

              {/* Delete */}
              <button
                onClick={() => handleDelete(agent.id)}
                disabled={deleting === agent.id}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 flex-shrink-0"
                title="Delete agent"
              >
                {deleting === agent.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 3h12M5 3V2h4v1M2 3l1 9h8l1-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}