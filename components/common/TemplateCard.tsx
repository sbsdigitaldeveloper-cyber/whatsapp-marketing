// components/templates/TemplateCard.tsx
import { Template } from "@/app/dashboard/templates/page";

interface Props {
  template: Template;
  onSend: () => void;
}

export default function TemplateCard({ template, onSend }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      {/* Top */}
      <div>
        {/* Name + Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight break-all">
            {template.name}
          </h3>
          <span className="shrink-0 text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
            {template.status}
          </span>
        </div>

        {/* Header */}
        {template.headerText && (
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {template.headerText}
          </p>
        )}

        {/* Body */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
            {template.bodyText || "No body text"}
          </p>
        </div>

        {/* Footer */}
        {template.footerText && (
          <p className="text-xs text-gray-400 italic mb-3">{template.footerText}</p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            🌐 {template.language}
          </span>
          {template.hasVariables && (
            <span className="flex items-center gap-1 text-amber-500">
              ⚡ {template.variableCount} variable{template.variableCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={onSend}
        className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
      >
        Send to Contacts →
      </button>
    </div>
  );
}