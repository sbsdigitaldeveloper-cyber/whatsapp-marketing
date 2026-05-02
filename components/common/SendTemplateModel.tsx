"use client";

import { useEffect, useState } from "react";
import { Template } from "@/app/dashboard/templates/page";
import {
  X, CheckCircle2, ChevronRight, ChevronLeft,
  Send, Users, Search, Loader2, Image, FileVideo, FileText
} from "lucide-react";

interface Contact {
  id: number;
  name: string | null;
  phone: string;
}

interface Props {
  template: Template;
  onClose: () => void;
}

type Step = 1 | 2 | 3;

// ─────────────────────────────────────────────────────────
// Template Analyzer — extract named variables & structure
// ─────────────────────────────────────────────────────────
function analyzeTemplate(components: any[]) {
  const result = {
    headerType: null as string | null,
    headerText: null as string | null,
    needsHeaderMedia: false,
    bodyParams: [] as string[],
    bodyText: "",
    footerText: null as string | null,
    buttons: [] as any[],
    needsButtonParams: false,
  };

  for (const comp of components) {
    if (comp.type === "HEADER") {
      result.headerType = comp.format;
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(comp.format)) result.needsHeaderMedia = true;
      if (comp.format === "TEXT") result.headerText = comp.text;
    }
    else if (comp.type === "BODY") {
      result.bodyText = comp.text || "";
      // Extract named variables like {{name}}, {{1}}, etc.
      result.bodyParams = comp.text?.match(/\{\{(\w+)\}\}/g)?.map((m: string) => m.replace(/\{\{|\}\}/g, "")) || [];
    }
    else if (comp.type === "FOOTER") {
      result.footerText = comp.text || null;
    }
    else if (comp.type === "BUTTONS") {
      result.buttons = comp.buttons || [];
      result.needsButtonParams = comp.buttons?.some((b: any) => b.type === "URL" && b.url?.includes("{{"));
    }
  }
  return result;
}

export default function SendTemplateModal({ template, onClose }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [campaignName, setCampaignName] = useState(`${template.name} - ${new Date().toLocaleDateString("en-IN")}`);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [headerMedia, setHeaderMedia] = useState("");
  const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
  const [buttonValues, setButtonValues] = useState<Record<number, string>>({});

  const analysis = analyzeTemplate(template.rawComponents || []);

  useEffect(() => { fetchContacts(); }, []);

  async function fetchContacts() {
    try {
      const res = await fetch("/api/contacts", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setContacts(data.contacts || data);
    } catch { setError("Failed to load contacts"); }
    finally { setFetching(false); }
  }

  const toggleContact = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(c => c.id));
  const filtered = contacts.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  // ── Validation ──
  const validateCurrentStep = () => {
    if (analysis.needsHeaderMedia && !headerMedia.trim()) return "Media URL is required";
    for (const v of analysis.bodyParams) if (!bodyValues[v]?.trim()) return `Fill value for {{${v}}}`;
    if (analysis.needsButtonParams) {
        const dynamicButtons = analysis.buttons.filter((b: any) => b.type === "URL" && b.url?.includes("{{"));
        for (let i = 0; i < dynamicButtons.length; i++) if (!buttonValues[i]?.trim()) return "Fill button URL suffix";
    }
    return null;
  };

  // ── Handle Final Send ──
  async function handleSend() {
    const err = validateCurrentStep();
    if (err) { setError(err); return; }

    try {
      setLoading(true);
      setError(null);

      // Structure data for Named Parameters (Worker handles this better)
      const templateParams = analysis.bodyParams.map(v => bodyValues[v] || "");
      
      const templateButtonParams = analysis.buttons
        .filter((b: any) => b.type === "URL" && b.url?.includes("{{"))
        .map((_, i) => buttonValues[i] || "");

      const res = await fetch("/api/whatsapp/templates/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          campaignName,
          templateName: template.name,
          templateLanguage: template.language,
          templateParams, 
          templateButtonParams: templateButtonParams.length > 0 ? templateButtonParams : null,
          templateHeaderType: analysis.headerType,
          templateHeaderMediaUrl: headerMedia || null,
          templateComponents: template.rawComponents, 
          contactIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Success! ${data.queued} messages queued.`);
      setTimeout(() => onClose(), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Preview Builder ──
  const buildPreviewText = () => {
    let text = analysis.bodyText;
    analysis.bodyParams.forEach(v => {
      text = text.replace(`{{${v}}}`, bodyValues[v] ? `*${bodyValues[v]}*` : `{{${v}}}`);
    });
    return text;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Success/Loading State */}
        {(loading || success) && (
          <div className="absolute inset-0 bg-white/95 z-[110] flex flex-col items-center justify-center p-10 animate-in fade-in">
            {loading ? (
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-black">Queuing Messages...</h3>
                </div>
            ) : (
                <div className="text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-black">Campaign Launched!</h3>
                    <p className="text-sm text-gray-500 mt-2">{success}</p>
                </div>
            )}
          </div>
        )}

        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-50 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Send size={20} className="text-green-600" /> Dispatch Campaign
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
          </div>
          <div className="flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${step >= s ? "bg-green-600 text-white shadow-lg" : "bg-gray-100 text-gray-400"}`}>{step > s ? "✓" : s}</div>
                {s < 3 && <div className={`h-1 flex-1 mx-4 rounded-full ${step > s ? "bg-green-600" : "bg-gray-100"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaign Name</label>
                <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-green-500/20 outline-none" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* PREVIEW */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp Preview</label>
                    <div className="bg-[#e5ddd5] rounded-3xl p-3 min-h-[250px] relative shadow-inner overflow-hidden">
                        <div className="bg-white rounded-xl p-2 shadow-sm text-[13px] relative z-10">
                            {analysis.needsHeaderMedia && headerMedia && <img src={headerMedia} className="w-full h-32 object-cover rounded-lg mb-2" />}
                            {analysis.headerText && <div className="font-bold mb-1">{analysis.headerText}</div>}
                            <div className="whitespace-pre-wrap text-gray-800">{buildPreviewText()}</div>
                            {analysis.footerText && <div className="text-[10px] text-gray-400 mt-1">{analysis.footerText}</div>}
                        </div>
                        {analysis.buttons.length > 0 && (
                            <div className="mt-1 space-y-1 relative z-10">
                                {analysis.buttons.map((b: any, i: number) => (
                                    <div key={i} className="bg-white/90 backdrop-blur py-2 rounded-lg text-center text-blue-500 text-xs font-bold shadow-sm">
                                        {b.text}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* INPUTS */}
                <div className="space-y-4">
                    {analysis.needsHeaderMedia && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">{analysis.headerType} URL</label>
                            <input type="text" placeholder="https://..." value={headerMedia} onChange={e => setHeaderMedia(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                        </div>
                    )}
                    {analysis.bodyParams.map((v) => (
                        <div key={v} className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Variable {"{{" + v + "}}"}</label>
                            <input type="text" value={bodyValues[v] || ""} onChange={e => setBodyValues({...bodyValues, [v]: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                        </div>
                    ))}
                    {analysis.buttons.filter((b: any) => b.type === "URL" && b.url?.includes("{{")).map((btn: any, i: number) => (
                        <div key={i} className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Button URL Suffix ({btn.text})</label>
                            <input type="text" value={buttonValues[i] || ""} onChange={e => setButtonValues({...buttonValues, [i]: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold" placeholder="e.g. coupon-123" />
                        </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="text" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl pl-12 py-3 text-sm outline-none" />
              </div>
              <div className="bg-gray-50 rounded-3xl p-2 max-h-[350px] overflow-y-auto no-scrollbar border border-gray-100">
                {fetching ? <Loader2 className="animate-spin mx-auto my-8 text-green-500" /> : 
                    filtered.map(c => (
                        <label key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white rounded-2xl cursor-pointer transition-all">
                            <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleContact(c.id)} className="w-4 h-4 accent-green-600" />
                            <div>
                                <p className="text-sm font-bold">{c.name || "Unknown"}</p>
                                <p className="text-[10px] text-gray-400">{c.phone}</p>
                            </div>
                        </label>
                    ))
                }
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center animate-in slide-in-from-right-4">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Users size={32} />
                </div>
                <h3 className="text-xl font-black">Confirm Send</h3>
                <div className="bg-gray-50 rounded-3xl p-6 text-left space-y-4 max-w-sm mx-auto">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase">Recipients</span><span className="font-bold text-green-600">{selectedIds.length} Contacts</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase">Template</span><span className="font-bold text-gray-800">{template.name}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase">Type</span><span className="font-bold text-gray-800">{analysis.headerType || "Text Only"}</span></div>
                </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-8 py-6 border-t border-gray-50 flex gap-4 bg-gray-50/30">
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as Step)} className="px-6 py-3 font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-600 flex items-center gap-2"><ChevronLeft size={16}/> Back</button>
          )}
          <div className="flex-1 flex gap-3">
            {step < 3 ? (
              <button 
                onClick={() => {
                    const err = validateCurrentStep();
                    if(err) setError(err);
                    else { setError(null); setStep(s => (s + 1) as Step); }
                }}
                disabled={step === 2 && selectedIds.length === 0}
                className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black disabled:bg-gray-100 transition-all shadow-xl"
              >
                Continue <ChevronRight size={16} className="inline ml-1" />
              </button>
            ) : (
              <button onClick={handleSend} disabled={loading} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl">
                🚀 Blast Messages
              </button>
            )}
          </div>
        </div>
        {error && <div className="absolute bottom-24 left-8 right-8 bg-red-50 text-red-500 text-[10px] font-bold p-3 rounded-xl border border-red-100 animate-bounce">{error}</div>}
      </div>
    </div>
  );
}