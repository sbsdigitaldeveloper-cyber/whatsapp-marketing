// app/admin/users/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "DELETED";

type Client = {
  id: number;
  name: string;
  email: string;
  orgName?: string;
  status: ClientStatus;
  isDeleted: boolean;
  deletedAt?: string;
  suspendedAt?: string;
  createdAt: string;
  _count?: {
    contacts: number;
    campaigns: number;
    agents: number;
    messages: number;
  };
  whatsappConfig?: {
    isActive: boolean;
    displayNumber: string;
    phoneNumberId: string;
  } | null;
};

type WAConfig = {
  businessId: string;
  phoneNumberId: string;
  displayNumber: string;
  accessToken: string;
  verifyToken: string;
};

type ActionType = "approve" | "suspend" | "restore" | "delete" | "unsuspend";

type ConfirmState = {
  open: boolean;
  type: ActionType | null;
  clientId: number | null;
  clientName: string;
};

type ToastItem = { id: number; message: string; type: "success" | "error" };

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Constants ────────────────────────────────────────────────────────────────

type ActionMeta = {
  title: string;
  desc: string;
  btnClass: string;
  label: string;
};

const ACTION_META: { [K in ActionType]: ActionMeta } = {
  approve: {
    title:    "Approve this client?",
    desc:     "This will activate the account and grant full dashboard access.",
    btnClass: "bg-green-600 hover:bg-green-700 text-white",
    label:    "Approve",
  },
  suspend: {
    title:    "Suspend this client?",
    desc:     "Their dashboard access will be disabled. All data is kept safe. You can restore at any time.",
    btnClass: "bg-amber-500 hover:bg-amber-600 text-white",
    label:    "Suspend",
  },
  unsuspend: {
    title:    "Reactivate this client?",
    desc:     "This will restore full dashboard access for this client.",
    btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
    label:    "Reactivate",
  },
  restore: {
    title:    "Restore deleted client?",
    desc:     "This will bring back the account and all their data. They will be set to ACTIVE.",
    btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
    label:    "Restore",
  },
  delete: {
    title:    "Soft-delete this client?",
    desc:     "They will lose access immediately. All data stays safe in the database and can be restored anytime.",
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
    label:    "Delete",
  },
};

const STATUS_BADGE: Record<ClientStatus, string> = {
  ACTIVE:    "bg-green-100 text-green-700 border border-green-200",
  PENDING:   "bg-amber-100 text-amber-700 border border-amber-200",
  SUSPENDED: "bg-orange-100 text-orange-600 border border-orange-200",
  DELETED:   "bg-red-100 text-red-600 border border-red-200",
};

const ENDPOINT_MAP = {
  approve:   "approve-user",
  suspend:   "suspend-user",
  unsuspend: "approve-user",
  restore:   "restore-user",
  delete:    "delete-user",
} as const;

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

let toastCounter = 0;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersPage() {
  const [clients, setClients]   = useState<Client[]>([]);
  const [filter, setFilter]     = useState<"ALL" | "ACTIVE" | "PENDING" | "SUSPENDED" | "DELETED">("ALL");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);

  const [configOpen, setConfigOpen]       = useState(false);
  const [configClient, setConfigClient]   = useState<Client | null>(null);
  const [configSaving, setConfigSaving]   = useState(false);
  const [showToken, setShowToken]         = useState(false);
  const [showWebhook, setShowWebhook]     = useState(false);
  const [waConfig, setWaConfig] = useState<WAConfig>({
    businessId:    "",
    phoneNumberId: "",
    displayNumber: "",
    accessToken:   "",
    verifyToken:   "",
  });

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false, type: null, clientId: null, clientName: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts]               = useState<ToastItem[]>([]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      // fetch ALL so we can filter client-side including deleted
      const res = await fetch("/api/admin/users?filter=all");
      if (!res.ok) throw new Error();
      const data = await res.json();

      // API returns { users, total, filter }
      // Normalize: deleted users show as DELETED status for UI
      const normalized: Client[] = (data.users ?? data).map((u: Client) => ({
        ...u,
        status: u.isDeleted ? "DELETED" : u.status,
      }));

      setClients(normalized);
    } catch {
      showToast("Failed to load clients", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(message: string, type: "success" | "error" = "success") {
    const id = ++toastCounter;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function requestAction(type: ActionType, client: Client) {
    setConfirm({ open: true, type, clientId: client.id, clientName: client.name });
  }

  async function executeAction() {
    if (!confirm.type || !confirm.clientId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/${ENDPOINT_MAP[confirm.type]}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: confirm.clientId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");

      showToast(`${confirm.clientName} — ${confirm.type} successful`);
      setConfirm({ open: false, type: null, clientId: null, clientName: "" });
      fetchClients();
    } catch (err: any) {
      showToast(err.message ?? "Action failed. Please try again.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  // ── WhatsApp Config ───────────────────────────────────────────────────────

  async function openConfig(client: Client) {
    setConfigClient(client);
    setShowToken(false);
    setShowWebhook(false);
    setWaConfig({
      businessId:    "",
      phoneNumberId: client.whatsappConfig?.phoneNumberId ?? "",
      displayNumber: client.whatsappConfig?.displayNumber ?? "",
      accessToken:   "",
      verifyToken:   "",
    });
    setConfigOpen(true);
  }

  async function saveConfig() {
    if (!configClient) return;

    if (!waConfig.phoneNumberId.trim()) {
      showToast("Phone Number ID is required", "error"); return;
    }
    if (!waConfig.displayNumber.trim()) {
      showToast("Display number is required", "error"); return;
    }
    if (!configClient.whatsappConfig && !waConfig.accessToken.trim()) {
      showToast("Access Token is required for initial setup", "error"); return;
    }

    setConfigSaving(true);
    try {
      const res = await fetch("/api/admin/setup-whatsapp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:        configClient.id,
          phoneNumberId: waConfig.phoneNumberId,
          displayNumber: waConfig.displayNumber,
          accessToken:   waConfig.accessToken,
          verifyToken:   waConfig.verifyToken,
          businessId:    waConfig.businessId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      // Update local state immediately without refetch
      setClients((prev) =>
        prev.map((c) =>
          c.id === configClient.id
            ? {
                ...c,
                whatsappConfig: {
                  isActive:      true,
                  displayNumber: waConfig.displayNumber,
                  phoneNumberId: waConfig.phoneNumberId,
                },
              }
            : c
        )
      );

      showToast(`WhatsApp config saved for ${configClient.name}`);
      setConfigOpen(false);
    } catch (err: any) {
      showToast(err.message ?? "Failed to save config", "error");
    } finally {
      setConfigSaving(false);
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredClients = clients.filter((c) => {
    const matchFilter = filter === "ALL" || c.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.orgName ?? "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const stats = {
    total:     clients.length,
    active:    clients.filter((c) => c.status === "ACTIVE").length,
    pending:   clients.filter((c) => c.status === "PENDING").length,
    suspended: clients.filter((c) => c.status === "SUSPENDED").length,
    deleted:   clients.filter((c) => c.isDeleted).length,
    configured: clients.filter((c) => c.whatsappConfig?.isActive).length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Client Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage clients, approve accounts, and configure WhatsApp access
          </p>
        </div>
        <button
          onClick={fetchClients}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total",      value: stats.total,      color: "text-gray-900" },
          { label: "Active",     value: stats.active,     color: "text-green-600" },
          { label: "Pending",    value: stats.pending,    color: "text-amber-600" },
          { label: "Suspended",  value: stats.suspended,  color: "text-orange-600" },
          { label: "Deleted",    value: stats.deleted,    color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`text-2xl font-semibold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or org…"
          className="flex-1 min-w-[200px] text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-400 transition"
        />
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "ACTIVE", "PENDING", "SUSPENDED", "DELETED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filter === f
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              {f === "DELETED" && stats.deleted > 0 && (
                <span className="ml-1 bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 text-[10px]">
                  {stats.deleted}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading clients…</div>
        ) : filteredClients.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">No clients found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Client</th>
                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">WhatsApp</th>
                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Data</th>
                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</th>
                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className={`border-t border-gray-100 transition-colors ${
                    client.isDeleted
                      ? "bg-red-50/40 hover:bg-red-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Client info */}
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs flex-shrink-0 ${
                        client.isDeleted
                          ? "bg-red-100 text-red-400"
                          : "bg-indigo-100 text-indigo-700"
                      }`}>
                        {initials(client.name)}
                      </div>
                      <div>
                        <div className={`font-medium ${client.isDeleted ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {client.name}
                        </div>
                        <div className="text-xs text-gray-400">{client.email}</div>
                        {client.orgName && (
                          <div className="text-xs text-gray-300">{client.orgName}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[client.status]}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {client.status}
                    </span>
                    {client.isDeleted && client.deletedAt && (
                      <div className="text-[10px] text-red-400 mt-0.5">
                        {formatDate(client.deletedAt)}
                      </div>
                    )}
                  </td>

                  {/* WhatsApp */}
                  <td className="p-3">
                    {client.whatsappConfig?.isActive ? (
                      <div>
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                          ✓ Configured
                        </span>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {client.whatsappConfig.displayNumber}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        Not set
                      </span>
                    )}
                  </td>

                  {/* Data counts */}
                  <td className="p-3">
                    {client._count ? (
                      <div className="flex gap-2 text-[10px] text-gray-400">
                        <span title="Contacts">👥 {client._count.contacts}</span>
                        <span title="Campaigns">📢 {client._count.campaigns}</span>
                        <span title="Messages">💬 {client._count.messages}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="p-3 text-xs text-gray-400">
                    {formatDate(client.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="p-3">
                    <div className="flex gap-2 items-center flex-wrap">

                      {/* Deleted user — only show Restore */}
                      {client.isDeleted && (
                        <button
                          onClick={() => requestAction("restore", client)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-medium transition"
                        >
                          ↺ Restore
                        </button>
                      )}

                      {/* Active user — can suspend or delete */}
                      {!client.isDeleted && client.status === "ACTIVE" && (
                        <>
                          <button
                            onClick={() => requestAction("suspend", client)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-medium transition"
                          >
                            ⏸ Suspend
                          </button>
                          <button
                            onClick={() => requestAction("delete", client)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium transition"
                          >
                            ✕ Delete
                          </button>
                        </>
                      )}

                      {/* Pending user — approve or delete */}
                      {!client.isDeleted && client.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => requestAction("approve", client)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-medium transition"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => requestAction("delete", client)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium transition"
                          >
                            ✕ Delete
                          </button>
                        </>
                      )}

                      {/* Suspended user — unsuspend or delete */}
                      {!client.isDeleted && client.status === "SUSPENDED" && (
                        <>
                          <button
                            onClick={() => requestAction("unsuspend", client)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-medium transition"
                          >
                            ↺ Reactivate
                          </button>
                          <button
                            onClick={() => requestAction("delete", client)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium transition"
                          >
                            ✕ Delete
                          </button>
                        </>
                      )}

                      {/* WA Config button — only for non-deleted users */}
                      {!client.isDeleted && (
                        <button
                          onClick={() => openConfig(client)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 font-medium transition"
                        >
                          ⚙ WA
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* WhatsApp Config Modal */}
      {configOpen && configClient && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setConfigOpen(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">WhatsApp Configuration</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {configClient.name}
                  {configClient.orgName ? ` — ${configClient.orgName}` : ""}
                </p>
              </div>
              <button
                onClick={() => setConfigOpen(false)}
                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  Business Account
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Business ID (WABA)</label>
                    <input
                      value={waConfig.businessId}
                      onChange={(e) => setWaConfig({ ...waConfig, businessId: e.target.value })}
                      placeholder="123456789012345"
                      className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone Number ID *</label>
                    <input
                      value={waConfig.phoneNumberId}
                      onChange={(e) => setWaConfig({ ...waConfig, phoneNumberId: e.target.value })}
                      placeholder="109876543210"
                      className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Display Phone Number *</label>
                    <input
                      value={waConfig.displayNumber}
                      onChange={(e) => setWaConfig({ ...waConfig, displayNumber: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  API Credentials
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Access Token {!configClient.whatsappConfig && "*"}
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={waConfig.accessToken}
                        onChange={(e) => setWaConfig({ ...waConfig, accessToken: e.target.value })}
                        placeholder={
                          configClient.whatsappConfig
                            ? "Leave blank to keep existing token"
                            : "EAAxxxxx…"
                        }
                        className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 pr-10 outline-none focus:border-indigo-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        {showToken ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Webhook Verify Token</label>
                    <div className="relative">
                      <input
                        type={showWebhook ? "text" : "password"}
                        value={waConfig.verifyToken}
                        onChange={(e) => setWaConfig({ ...waConfig, verifyToken: e.target.value })}
                        placeholder="Your custom verify string"
                        className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 pr-10 outline-none focus:border-indigo-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWebhook(!showWebhook)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        {showWebhook ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end px-6 pb-6">
              <button
                onClick={() => setConfigOpen(false)}
                className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveConfig}
                disabled={configSaving}
                className="text-sm px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60 font-medium"
              >
                {configSaving ? "Saving…" : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm.open && confirm.type && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 text-lg ${
              confirm.type === "delete"
                ? "bg-red-50 border border-red-200"
                : "bg-amber-50 border border-amber-200"
            }`}>
              {confirm.type === "delete" ? "🗑" : "⚠️"}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {ACTION_META[confirm.type].title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-1">
              {ACTION_META[confirm.type].desc}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Client: <span className="font-medium text-gray-600">{confirm.clientName}</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setConfirm({ open: false, type: null, clientId: null, clientName: "" })
                }
                className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={actionLoading}
                className={`text-sm px-5 py-2 rounded-lg font-medium transition disabled:opacity-60 ${ACTION_META[confirm.type].btnClass}`}
              >
                {actionLoading ? "Processing…" : ACTION_META[confirm.type].label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm shadow-lg border min-w-[240px] ${
              t.type === "success"
                ? "bg-white border-green-200 text-gray-800"
                : "bg-white border-red-200 text-gray-800"
            }`}
          >
            <span className={t.type === "success" ? "text-green-500" : "text-red-500"}>
              {t.type === "success" ? "✓" : "✕"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}