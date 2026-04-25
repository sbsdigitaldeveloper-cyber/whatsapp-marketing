// components/common/TemplateCard.tsx
import { MessageCircle, Send, Languages, Info } from "lucide-react";

export default function TemplateCard({ template, onSend }: { template: any, onSend: () => void }) {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300 overflow-hidden flex flex-col group">
      
      {/* Visual Preview Area */}
      <div className="p-5 bg-gray-50 border-b border-gray-100 relative">
        <div className="flex justify-between items-start mb-4">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase">
            {template.status}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
            <Languages size={12} /> {template.language}
          </div>
        </div>

        {/* The Chat Bubble Look */}
        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm text-[13px] leading-relaxed text-gray-700">
          {template.headerText && <p className="font-black text-gray-900 mb-1">{template.headerText}</p>}
          <p className="whitespace-pre-wrap line-clamp-4">{template.bodyText}</p>
          {template.footerText && <p className="text-[10px] text-gray-400 mt-2">{template.footerText}</p>}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 text-sm truncate mb-1 group-hover:text-green-600 transition-colors">
          {template.name.replaceAll('_', ' ')}
        </h3>
        
        <div className="flex items-center gap-2 mt-auto pt-4">
          <button 
            onClick={onSend}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-100"
          >
            <Send size={14} /> Send Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}