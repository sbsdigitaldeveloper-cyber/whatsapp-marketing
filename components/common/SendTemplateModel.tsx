// components/templates/SendTemplateModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Template } from "@/app/dashboard/templates/page";

interface Contact {
  id: number;
  name: string | null;
  phone: string;
}

interface Props {
  template: Template;
  onClose: () => void;
}

export default function SendTemplateModal({ template, onClose }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [params, setParams] = useState<string[]>(
    Array(template.variableCount).fill("")
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContacts(data.contacts || data);
    } catch {
      setError("Failed to load contacts");
    } finally {
      setFetching(false);
    }
  }

  function toggleContact(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  }

  // Preview body with variable substitution
  function previewBody() {
    let text = template.bodyText;
    params.forEach((val, i) => {
      text = text.replace(`{{${i + 1}}}`, val ? `*${val}*` : `{{${i + 1}}}`);
    });
    return text;
  }

  async function handleSend() {
    if (selectedIds.length === 0) {
      setError("Please select at least one contact");
      return;
    }

    if (template.hasVariables && params.some((p) => !p.trim())) {
      setError("Please fill in all template variables");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const res = await fetch("/api/whatsapp/templates/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateName: template.name,
          templateLanguage: template.language,
          templateParams: params,
          contactIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`✅ Queued for ${data.queued} contacts successfully!`);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = contacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Send Template</h2>
            <p className="text-xs text-gray-400 mt-0.5">{template.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Template Preview */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Preview
            </p>
            <div className="bg-[#e9fbe5] rounded-xl p-4 max-w-sm">
              {template.headerText && (
                <p className="font-semibold text-gray-800 text-sm mb-1">
                  {template.headerText}
                </p>
              )}
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {previewBody()}
              </p>
              {template.footerText && (
                <p className="text-xs text-gray-400 mt-2">{template.footerText}</p>
              )}
            </div>
          </div>

          {/* Variable Inputs */}
          {template.hasVariables && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Fill Variables
              </p>
              <div className="space-y-2">
                {params.map((val, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-12 shrink-0">
                      {`{{${i + 1}}}`}
                    </span>
                    <input
                      type="text"
                      placeholder={`Variable ${i + 1}`}
                      value={val}
                      onChange={(e) => {
                        const updated = [...params];
                        updated[i] = e.target.value;
                        setParams(updated);
                      }}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Select Contacts ({selectedIds.length} selected)
              </p>
              <button
                onClick={toggleAll}
                className="text-xs text-green-600 hover:underline"
              >
                {selectedIds.length === filtered.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {fetching ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No contacts found
                  </p>
                ) : (
                  filtered.map((contact, i) => (
                    <label
                      key={contact.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        i !== filtered.length - 1 ? "border-b border-gray-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="accent-green-500 w-4 h-4"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {contact.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400">{contact.phone}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Feedback */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              {success}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || selectedIds.length === 0}
            className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm font-medium transition-colors"
          >
            {loading
              ? "Sending..."
              : `Send to ${selectedIds.length} Contact${selectedIds.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}