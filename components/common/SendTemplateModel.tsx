"use client";

import { useEffect, useState } from "react";
import { Template } from "@/app/dashboard/templates/page";
import { X, CheckCircle2, ChevronRight, ChevronLeft, Send, Users, Search, Loader2 } from "lucide-react";

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

export default function SendTemplateModal({ template, onClose }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [params, setParams] = useState<string[]>(Array(template.variableCount).fill(""));
  const [campaignName, setCampaignName] = useState(`${template.name} - ${new Date().toLocaleDateString("en-IN")}`);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchContacts(); }, []);

  async function fetchContacts() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/contacts", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setContacts(data.contacts || data);
    } catch { setError("Failed to load contacts"); } finally { setFetching(false); }
  }

  const toggleContact = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(c => c.id));
  const previewBody = () => {
    let text = template.bodyText;
    params.forEach((val, i) => { text = text.replace(`{{${i + 1}}}`, val ? `*${val}*` : `{{${i + 1}}}`); });
    return text;
  };

  async function handleSend() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/whatsapp/templates/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ campaignName, templateName: template.name, templateLanguage: template.language, templateParams: params, contactIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess(`Success! ${data.queued} messages queued.`);
      setTimeout(() => onClose(), 2500);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  const filtered = contacts.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
  const canProceed = () => step === 1 ? (campaignName.trim() && (!template.hasVariables || params.every(p => p.trim()))) : step === 2 ? selectedIds.length > 0 : true;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200 max-h-[90vh]">
        
        {/* --- LOADING/SUCCESS OVERLAY --- */}
        {(loading || success) && (
          <div className="absolute inset-0 bg-white/95 z-[110] flex flex-col items-center justify-center text-center p-10 animate-in fade-in">
            {loading ? (
              <div className="space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  <Loader2 className="w-20 h-20 text-green-600 animate-spin" strokeWidth={1} />
                  <Send className="absolute inset-0 m-auto text-green-500 animate-pulse" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Pushing to Queue</h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">BullMQ is preparing {selectedIds.length} messages...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in zoom-in">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900">Campaign Launched!</h3>
                <p className="text-green-600 font-bold">{success}</p>
              </div>
            )}
          </div>
        )}

        {/* --- HEADER --- */}
        <div className="px-8 py-6 border-b border-gray-50 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Send size={20} className="text-green-600" /> Dispatch Campaign
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
          </div>
          
          <div className="flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${step >= s ? "bg-green-600 text-white shadow-lg" : "bg-gray-100 text-gray-400"}`}>
                  {step > s ? "✓" : s}
                </div>
                {s < 3 && <div className={`h-1 flex-1 mx-4 rounded-full ${step > s ? "bg-green-600" : "bg-gray-100"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaign Name</label>
                <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-green-500/20 outline-none transition-all" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview</label>
                  <div className="bg-[#DCF8C6] rounded-2xl p-4 border border-green-100 text-[13px] text-gray-800 leading-relaxed min-h-[140px]">
                    {template.headerText && <p className="font-bold mb-1">{template.headerText}</p>}
                    <p className="whitespace-pre-wrap">{previewBody()}</p>
                    {template.footerText && <p className="text-[10px] text-gray-400 mt-2">{template.footerText}</p>}
                  </div>
                </div>

                {template.hasVariables && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fill Variables</label>
                    {params.map((val, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-2 shadow-sm">
                        <span className="w-8 text-[10px] font-bold text-gray-400">{`{{${i+1}}}`}</span>
                        <input type="text" value={val} onChange={(e) => { const u = [...params]; u[i] = e.target.value; setParams(u); }} className="flex-1 text-xs font-bold outline-none" placeholder="Value..." />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="text" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl pl-12 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500/20 transition-all" />
              </div>
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black text-gray-400 uppercase">{selectedIds.length} Selected</p>
                <button onClick={toggleAll} className="text-[10px] font-black text-green-600 uppercase hover:underline">Select/Deselect All</button>
              </div>
              <div className="bg-gray-50/50 rounded-[2rem] border border-gray-100 max-h-[300px] overflow-y-auto p-2 no-scrollbar">
                {filtered.map(c => (
                  <label key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white hover:shadow-sm rounded-2xl cursor-pointer transition-all">
                    <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleContact(c.id)} className="w-4 h-4 rounded text-green-600 accent-green-600" />
                    <div className="flex-1"><p className="text-sm font-bold text-gray-900">{c.name || "Unknown"}</p><p className="text-[10px] text-gray-400">{c.phone}</p></div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 text-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2"><Users size={32} /></div>
              <h3 className="text-xl font-black text-gray-900">Review & Confirm</h3>
              <div className="bg-gray-50 rounded-[2rem] p-6 text-left space-y-4">
                <div className="flex justify-between border-b border-gray-200/50 pb-2"><span className="text-[10px] font-black text-gray-400 uppercase">Recipients</span><span className="text-sm font-bold text-green-600">{selectedIds.length} Contacts</span></div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2"><span className="text-[10px] font-black text-gray-400 uppercase">Campaign</span><span className="text-sm font-bold text-gray-800">{campaignName}</span></div>
                <div className="flex justify-between"><span className="text-[10px] font-black text-gray-400 uppercase">Template</span><span className="text-sm font-bold text-gray-800">{template.name}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="px-8 py-6 border-t border-gray-50 flex gap-4 bg-gray-50/30">
          {step > 1 && (
            <button onClick={() => setStep(s => (s-1) as Step)} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-600">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="flex-1 flex gap-3">
            {step < 3 ? (
              <button onClick={() => setStep(s => (s+1) as Step)} disabled={!canProceed()} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-xl shadow-gray-200">
                Continue <ChevronRight size={16} className="inline ml-1" />
              </button>
            ) : (
              <button onClick={handleSend} disabled={loading} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2">
                🚀 Blast {selectedIds.length} Messages
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}