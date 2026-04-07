 // app/dashboard/templates/page.tsx
"use client";

import { useEffect, useState } from "react";


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
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/whatsapp/templates", {
        headers: { Authorization: `Bearer ${token}` },
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Send Meta-approved templates directly to your contacts
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* States */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-44 border border-gray-100" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No approved templates found</p>
          <p className="text-sm mt-1">Templates must be approved in Meta Business Manager</p>
        </div>
      )}

      {/* Template Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <TemplateCard
              key={`${template.name}-${template.language}`}
              template={template}
              onSend={() => setSelectedTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Send Modal */}
      {selectedTemplate && (
        <SendTemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}