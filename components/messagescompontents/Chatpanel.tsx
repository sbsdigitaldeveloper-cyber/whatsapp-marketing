"use client";

import { Contact } from "@/lib/chatsandmessages/types";
import { MessageBubble } from "./Messagebubble";
import { useState, useRef, useEffect } from "react";

function getInitials(name: string | null, phone: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  return phone.slice(-2);
}

type AttachmentType = "image" | "document" | "video" | null;

interface AttachmentPreview {
  file: File;
  type: AttachmentType;
  previewUrl?: string;
}

interface Agent {
  id: number;
  name: string;
  email: string;
}

const ACCEPTED_TYPES = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  document:
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain",
  video: "video/mp4,video/3gpp,video/quicktime",
};

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return "🖼️";
  if (file.type === "application/pdf") return "📄";
  if (file.type.includes("word")) return "📝";
  if (file.type.includes("excel") || file.type.includes("spreadsheet")) return "📊";
  if (file.type.startsWith("video/")) return "🎥";
  return "📎";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatPanel({
  contact,
  onRefresh,
}: {
  contact: Contact | null;
  onRefresh: () => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<AttachmentPreview | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [assignedAgentId, setAssignedAgentId] = useState<number | null>(null);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const assignMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [contact?.messages]);

  useEffect(() => {
    setAssignedAgentId((contact as any)?.assignedAgentId ?? null);
    setAssignError(null);
  }, [contact?.id]);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showAttachMenu) return;
    const handler = () => setShowAttachMenu(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [showAttachMenu]);

  useEffect(() => {
    if (!showAssignMenu) return;
    const handler = (e: MouseEvent) => {
      if (!assignMenuRef.current?.contains(e.target as Node)) setShowAssignMenu(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [showAssignMenu]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: AttachmentType) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview: AttachmentPreview = { file, type };
    if (type === "image") preview.previewUrl = URL.createObjectURL(file);
    setAttachment(preview);
    setShowAttachMenu(false);
    e.target.value = "";
  }

  function removeAttachment() {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  }

  async function handleAssign(agentId: number | null) {
    if (!contact) return;
    setAssigning(true);
    setAssignError(null);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign");
      setAssignedAgentId(agentId);
      setShowAssignMenu(false);
      onRefresh();
    } catch (err: any) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  async function handleReply() {
    if (!replyText.trim() && !attachment) return;
    setSending(true);
    setError(null);
    try {
      if (attachment) {
        const formData = new FormData();
        formData.append("contactId", String(contact?.id));
        formData.append("file", attachment.file);
        formData.append("mediaType", attachment.type ?? "document");
        if (replyText.trim()) formData.append("caption", replyText.trim());
        const res = await fetch("/api/messages/reply-media", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send media");
      } else {
        const res = await fetch("/api/messages/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: contact?.id, message: replyText }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send");
      }
      setReplyText("");
      removeAttachment();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
          💬
        </div>
        <p className="text-sm text-slate-400 font-medium">Select a contact to view messages</p>
      </div>
    );
  }

  const assignedAgent = agents.find((a) => a.id === assignedAgentId);
  const canSend = contact.optIn && !sending && (!!replyText.trim() || !!attachment);
  const charCount = replyText.length;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-white">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 text-xs font-semibold flex-shrink-0">
          {getInitials(contact.name, contact.phone)}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-slate-800 leading-tight truncate">
            {contact.name ?? "Unknown"}
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>{contact.phone}</span>
            <span className="opacity-30">·</span>
            <span className={contact.optIn ? "text-teal-600 font-medium" : "text-red-500 font-medium"}>
              {contact.optIn ? "✓ opt-in" : "opted out"}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Message count */}
          <span className="text-xs font-mono bg-slate-100 text-slate-500 border border-slate-200 rounded-md px-2.5 py-1">
            {contact.messageCount} msg{contact.messageCount !== 1 ? "s" : ""}
          </span>

          {/* Assign dropdown */}
          <div className="relative" ref={assignMenuRef}>
            <button
              onClick={() => setShowAssignMenu((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${
                assignedAgent
                  ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {assigning ? (
                <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="5" r="3" />
                  <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                </svg>
              )}
              <span>{assignedAgent ? assignedAgent.name : "Assign"}</span>
              <span className="opacity-40 text-[10px]">▾</span>
            </button>

            {showAssignMenu && (
              <div className="absolute top-full right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[210px] z-20">
                <p className="text-[10px] text-slate-400 font-mono px-4 pt-1.5 pb-1 uppercase tracking-wider">
                  Assign to agent
                </p>

                {agents.length === 0 ? (
                  <p className="text-xs text-slate-400 px-4 py-3">
                    No agents yet —{" "}
                    <a href="/agents" className="text-teal-600 underline">
                      create one
                    </a>
                  </p>
                ) : (
                  agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAssign(agent.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 ${
                        assignedAgentId === agent.id
                          ? "text-teal-700 font-medium"
                          : "text-slate-700"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-800 flex-shrink-0">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="leading-tight truncate">{agent.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{agent.email}</p>
                      </div>
                      {assignedAgentId === agent.id && (
                        <span className="text-teal-500 text-xs">✓</span>
                      )}
                    </button>
                  ))
                )}

                {assignedAgentId && (
                  <>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => handleAssign(null)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-xs flex-shrink-0">
                        ✕
                      </div>
                      <span>Unassign</span>
                    </button>
                  </>
                )}

                {assignError && (
                  <p className="text-[10px] text-red-500 font-mono px-4 pb-2 pt-1">
                    ⚠ {assignError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-slate-50">
        {/* Opted-out warning */}
        {!contact.optIn && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-600">
            <span>⛔</span>
            <span>
              This contact has <strong>opted out</strong> — no messages will be sent.
            </span>
          </div>
        )}

        {/* Assigned agent banner */}
        {assignedAgent && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500">
            <svg className="w-3.5 h-3.5 text-teal-600" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5" r="3" />
              <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            </svg>
            Assigned to{" "}
            <strong className="text-slate-700 font-medium">{assignedAgent.name}</strong>
          </div>
        )}

        {contact.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-slate-400 py-16">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-xl">
              📭
            </div>
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          contact.messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Attachment Preview ── */}
      {attachment && (
        <div className="px-4 pt-3 pb-1 bg-white border-t border-slate-100">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            {attachment.type === "image" && attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt="preview"
                className="w-12 h-12 rounded-md object-cover border border-slate-200 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-xl flex-shrink-0">
                {getFileIcon(attachment.file)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{attachment.file.name}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {formatBytes(attachment.file.size)} · {attachment.type}
              </p>
            </div>
            <button
              onClick={removeAttachment}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Reply Box ── */}
      <div className="px-4 pt-2.5 pb-3 border-t border-slate-200 bg-white flex flex-col gap-2">
        {error && (
          <p className="text-xs text-red-500 font-mono px-1">⚠ {error}</p>
        )}

        <div className="flex gap-2 items-end">
          {/* Attach button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              disabled={!contact.optIn || sending}
              onClick={() => setShowAttachMenu((v) => !v)}
              title="Attach file"
              className="w-9 h-9 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base"
            >
              📎
            </button>

            {showAttachMenu && (
              <div className="absolute bottom-11 left-0 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[165px] z-10">
                <button
                  onClick={() => imageRef.current?.click()}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base">🖼️</span>
                  <span>Image</span>
                  <span className="ml-auto text-xs text-slate-400">JPG, PNG…</span>
                </button>
                <button
                  onClick={() => documentRef.current?.click()}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base">📄</span>
                  <span>Document</span>
                  <span className="ml-auto text-xs text-slate-400">PDF, DOC…</span>
                </button>
                <button
                  onClick={() => videoRef.current?.click()}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base">🎥</span>
                  <span>Video</span>
                  <span className="ml-auto text-xs text-slate-400">MP4…</span>
                </button>
              </div>
            )}
          </div>

          <input ref={imageRef} type="file" accept={ACCEPTED_TYPES.image} className="hidden" onChange={(e) => handleFileChange(e, "image")} />
          <input ref={documentRef} type="file" accept={ACCEPTED_TYPES.document} className="hidden" onChange={(e) => handleFileChange(e, "document")} />
          <input ref={videoRef} type="file" accept={ACCEPTED_TYPES.video} className="hidden" onChange={(e) => handleFileChange(e, "video")} />

          {/* Text input */}
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSend && handleReply()}
            placeholder={
              attachment
                ? "Add a caption (optional)…"
                : contact.optIn
                ? "Type a reply…"
                : "Contact opted out"
            }
            disabled={!contact.optIn || sending}
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-md px-3.5 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-9"
          />

          {/* Send button */}
          <button
            onClick={handleReply}
            disabled={!canSend}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm px-4 rounded-md transition-colors font-medium h-9 flex-shrink-0"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Send
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 8l12-6-6 12-2-5-4-1z" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Hint row */}
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] text-slate-400 font-mono">Enter to send · attach images, docs, video</p>
          <p className={`text-[10px] font-mono ${charCount > 900 ? "text-amber-500" : "text-slate-400"}`}>
            {charCount} / 1024
          </p>
        </div>
      </div>

    </div>
  );
}