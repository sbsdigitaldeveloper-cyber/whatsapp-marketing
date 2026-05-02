"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, Layers, Eye, X, FileImage, FileText, FileVideo } from "lucide-react";
import TemplateCard from "@/components/common/TemplateCard";
import SendTemplateModal from "@/components/common/SendTemplateModel";

export interface Template {
  name: string;
  language: string;
  bodyText: string;
  hasVariables: boolean;
  variableCount: number;
  variableNames: string[];
  headerText: string | null;
  headerType: string | null;       // "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | null
  headerMediaUrl: string | null;   // Image/Video/Doc URL
  footerText: string | null;
  buttons: { type: string; text: string; url?: string; phone?: string }[];
  hasButtons: boolean;
  bodyExamples: string[];
  rawComponents: any[];
}

// ─────────────────────────────────────────────
// WhatsApp Preview Modal
// ─────────────────────────────────────────────
function WhatsAppPreviewModal({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  // Replace variables with colored placeholders
  const renderBody = () => {
    let text = template.bodyText;
    const vars = text.match(/\{\{(\w+)\}\}/g) || [];
    vars.forEach((v) => {
      const varName = v.replace(/\{\{|\}\}/g, "");
      text = text.replace(v, `__VAR__${varName}__ENDVAR__`);
    });
    return text.split(/(__VAR__.+?__ENDVAR__)/).map((part, i) => {
      if (part.startsWith("__VAR__")) {
        const name = part.replace("__VAR__", "").replace("__ENDVAR__", "");
        return (
          <span key={i} className="text-blue-600 font-semibold bg-blue-50 px-1 rounded">
            {`{{${name}}}`}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getButtonStyle = (type: string) => {
    switch (type) {
      case "URL":           return "text-blue-500";
      case "PHONE_NUMBER":  return "text-green-600";
      default:              return "text-blue-500";
    }
  };

  const getButtonIcon = (type: string) => {
    switch (type) {
      case "URL":           return "🔗";
      case "PHONE_NUMBER":  return "📞";
      default:              return "↩️";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="relative">
        {/* Close button outside phone */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-20 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition"
        >
          <X size={16} />
        </button>

        {/* Phone Frame */}
        <div className="bg-gray-900 w-[340px] rounded-[3rem] p-3 shadow-2xl">
          {/* Notch */}
          <div className="w-24 h-5 bg-gray-800 rounded-full mx-auto mb-2" />

          {/* Screen */}
          <div className="bg-[#E5DDD5] rounded-[2.2rem] overflow-hidden">

            {/* WhatsApp Header Bar */}
            <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                WA
              </div>
              <div>
                <p className="text-white font-bold text-xs">Business Account</p>
                <p className="text-white/60 text-[10px]">Online</p>
              </div>
            </div>

            {/* Chat Area */}
            <div className="h-[460px] overflow-y-auto px-3 py-4 flex flex-col gap-3"
              style={{
                backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
                backgroundRepeat: "repeat",
              }}
            >
              {/* Message Bubble */}
              <div className="self-start max-w-[92%]">
                <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border border-gray-100 relative">
                  {/* Bubble Tip */}
                  <div className="absolute top-0 -left-[7px] w-0 h-0 border-t-[10px] border-t-white border-l-[8px] border-l-transparent" />

                  {/* ── HEADER ── */}
                  {template.headerType === "IMAGE" && (
                    <div className="bg-gray-200 h-36 flex items-center justify-center">
                      {template.headerMediaUrl ? (
                        <img
                          src={template.headerMediaUrl}
                          alt="Header"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <FileImage size={28} />
                          <span className="text-[10px] mt-1">Image Header</span>
                        </div>
                      )}
                    </div>
                  )}

                  {template.headerType === "VIDEO" && (
                    <div className="bg-gray-800 h-36 flex items-center justify-center">
                      <div className="flex flex-col items-center text-gray-400">
                        <FileVideo size={28} />
                        <span className="text-[10px] mt-1 text-white/60">Video Header</span>
                      </div>
                    </div>
                  )}

                  {template.headerType === "DOCUMENT" && (
                    <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                      <FileText size={22} className="text-red-500 shrink-0" />
                      <span className="text-[11px] text-gray-700 font-medium">Document</span>
                    </div>
                  )}

                  {template.headerType === "TEXT" && template.headerText && (
                    <div className="px-3 pt-3 pb-1 font-black text-gray-900 text-[13px] border-b border-gray-100">
                      {template.headerText}
                    </div>
                  )}

                  {/* ── BODY ── */}
                  <div className="px-3 py-2.5 text-[13px] text-gray-800 leading-[1.5] whitespace-pre-wrap">
                    {renderBody()}
                  </div>

                  {/* ── FOOTER ── */}
                  {template.footerText && (
                    <div className="px-3 pb-2 text-[11px] text-gray-400 italic">
                      {template.footerText}
                    </div>
                  )}

                  {/* ── TIMESTAMP ── */}
                  <div className="flex justify-end items-center gap-1 px-3 pb-2">
                    <span className="text-[10px] text-gray-400">10:42 AM</span>
                    <span className="text-blue-400 text-[11px]">✓✓</span>
                  </div>

                  {/* ── BUTTONS ── */}
                  {template.buttons?.length > 0 && (
                    <div className="border-t border-gray-100">
                      {template.buttons.map((btn, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold ${getButtonStyle(btn.type)} ${
                            i < template.buttons.length - 1 ? "border-b border-gray-100" : ""
                          }`}
                        >
                          <span>{getButtonIcon(btn.type)}</span>
                          {btn.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variables hint */}
                {template.variableNames?.length > 0 && (
                  <div className="mt-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                    <p className="text-[10px] text-yellow-700 font-bold mb-0.5">Variables in this template:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variableNames.map((v, i) => (
                        <span key={i} className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono">
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Bar Mock */}
            <div className="bg-[#F0F2F5] px-3 py-2 flex items-center gap-2">
              <div className="flex-1 bg-white rounded-full h-9 px-4 flex items-center">
                <span className="text-gray-400 text-[11px]">Type a message</span>
              </div>
              <div className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center text-white text-xs">
                ▶
              </div>
            </div>
          </div>

          {/* Home Bar */}
          <div className="w-24 h-1 bg-gray-600 rounded-full mx-auto mt-2" />
        </div>

        {/* Template Name Badge */}
        <div className="mt-3 text-center">
          <span className="text-xs font-bold text-white/80 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
            {template.name} · {template.language}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Templates Page
// ─────────────────────────────────────────────
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/whatsapp/templates", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates(data.templates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center pb-20">

      {/* ── Header ── */}
      <div className="w-full bg-white border-b border-gray-100 mb-8 flex justify-center">
        <div className="w-full max-w-6xl px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={20} className="text-green-600" />
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Message Templates
              </h1>
            </div>
            <p className="text-sm text-gray-500 font-medium ml-7">
              Manage and broadcast approved Meta templates
            </p>
          </div>
          <button
            onClick={fetchTemplates}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-2xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Meta
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl px-6">

        {/* ── Search ── */}
        <div className="relative mb-10 max-w-lg mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-[2rem] shadow-xl shadow-gray-200/40 focus:ring-2 focus:ring-green-500 outline-none text-sm transition-all"
          />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl px-6 py-4 mb-6 text-center">
            {error}
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] p-8 h-64 border border-gray-50 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Template Grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {filtered.map((template) => (
              <div key={`${template.name}-${template.language}`} className="flex flex-col gap-3 w-full">
                <TemplateCard
                  template={template}
                  onSend={() => setSelectedTemplate(template)}
                />
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-gray-500 hover:text-green-600 bg-white/50 hover:bg-white rounded-xl border border-dashed border-gray-200 transition-all mx-4"
                >
                  <Eye size={14} /> Preview WhatsApp Layout
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Search size={32} />
            </div>
            <h3 className="text-gray-900 font-bold">No templates found</h3>
            <p className="text-gray-500 text-sm mt-1">
              Try a different search term or sync with Meta.
            </p>
          </div>
        )}
      </div>

      {/* ── Send Modal ── */}
      {selectedTemplate && (
        <SendTemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}

      {/* ── WhatsApp Preview Modal ── */}
      {previewTemplate && (
        <WhatsAppPreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}