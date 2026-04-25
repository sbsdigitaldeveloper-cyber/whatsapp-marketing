"use client";

import { useEffect, useState } from "react";
import { Search, AlertCircle, RefreshCw, Layers, Eye, X } from "lucide-react";
import TemplateCard from "@/components/common/TemplateCard";
import SendTemplateModal from "@/components/common/SendTemplateModel";

export interface Template {
  name: string;
  language: string;
  status: string;
  bodyText: string;
  headerText: string | null;
  footerText: string | null;
  hasVariables: boolean;
  variableCount: number;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
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
      
      {/* ── Header Section ── */}
      <div className="w-full bg-white border-b border-gray-100 mb-8 flex justify-center">
        <div className="w-full max-w-6xl px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={20} className="text-green-600" />
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Message Templates</h1>
            </div>
            <p className="text-sm text-gray-500 font-medium ml-7">Manage and broadcast approved Meta templates</p>
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
        
        {/* ── Search Bar ── */}
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

        {/* ── Loading State ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] p-8 h-64 border border-gray-50 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Grid with Preview Button ── */}
        {!loading && !error && (
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
        {!loading && filtered.length === 0 && !error && (
           <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Search size={32} />
              </div>
              <h3 className="text-gray-900 font-bold">No templates found</h3>
              <p className="text-gray-500 text-sm mt-1">Try a different search term or sync with Meta.</p>
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

      {/* ── WhatsApp Style Preview Modal ── */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-[#E5DDD5] w-full max-w-[340px] rounded-[2.5rem] overflow-hidden shadow-2xl border-[10px] border-gray-900 relative">
            
            {/* Phone Top Notch Mock */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>

            {/* WhatsApp Header */}
            <div className="bg-[#075E54] pt-8 pb-3 px-4 flex items-center gap-3">
              <button onClick={() => setPreviewTemplate(null)} className="text-white hover:bg-white/10 p-1 rounded-full">
                <X size={18} />
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0 border border-white/20 overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=WA&bg=25D366&color=fff" alt="avatar" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xs">WhatsApp Preview</span>
                <span className="text-[10px] text-white/70">Online</span>
              </div>
            </div>

            {/* Chat Body (Classic WhatsApp Background) */}
            <div className="h-[420px] overflow-y-auto p-4 flex flex-col bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
              
              <div className="bg-white rounded-lg rounded-tl-none p-2.5 shadow-sm max-w-[90%] relative self-start mb-4 border border-gray-100">
                {/* Message Tip */}
                <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent"></div>

                {/* Header Text */}
                {previewTemplate.headerText && (
                  <div className="font-bold text-gray-900 text-[13px] mb-1.5 pb-1 border-b border-gray-50">
                    {previewTemplate.headerText}
                  </div>
                )}

                {/* Body Text (Variables Replaced) */}
                <div className="text-[13px] text-gray-800 whitespace-pre-wrap leading-[1.4]">
                  {previewTemplate.bodyText.replace(/{{(\d+)}}/g, (match) => {
                    return `<span class="text-blue-600 font-medium">[Var${match.match(/\d+/)}]</span>`;
                  })}
                  {/* Using dangerouslySetInnerHTML if you want the blue variables, 
                      or just use .replace for plain text */}
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: previewTemplate.bodyText.replace(/{{(\d+)}}/g, `<span style="color: #2563eb; font-weight: 500;">[Variable]</span>`) 
                    }} 
                  />
                </div>

                {/* Footer Text */}
                {previewTemplate.footerText && (
                  <div className="mt-1.5 text-[11px] text-gray-400 italic">
                    {previewTemplate.footerText}
                  </div>
                )}

                {/* Time & Tick */}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-gray-400">10:42 AM</span>
                  <div className="flex">
                    <span className="text-blue-400 text-[10px]">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Action Suggestion */}
              <div className="text-center py-2 bg-white/60 backdrop-blur-sm rounded-lg text-[10px] text-gray-500 mb-4 px-2">
                Buttons (if any) will appear here in the real message.
              </div>
            </div>

            {/* Bottom Input Mock */}
            <div className="bg-white p-3 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 h-8 rounded-full"></div>
              <div className="w-8 h-8 bg-[#075E54] rounded-full flex items-center justify-center text-white">
                <RefreshCw size={14} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}