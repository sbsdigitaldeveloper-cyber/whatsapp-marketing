// "use client";

// import { Message } from "@/lib/chatsandmessages/types";
// import { StatusBadge } from "./Statusbadge";





// function formatDate(dateStr: string | null) {
//   if (!dateStr) return "—";
//   const d = new Date(dateStr);
//   return d.toLocaleString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// export function MessageBubble({ msg }: { msg: Message }) {
//   const isTemplate = msg.campaign.messageType === "TEMPLATE";
//   const params = msg.campaign.templateParams
//     ? (JSON.parse(msg.campaign.templateParams) as string[])
//     : [];

//   return (
//     <div className="flex flex-col items-end gap-1">
//       {/* Campaign tag */}
//       <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400/80">
//         <span>📣</span>
//         <span>{msg.campaign.name}</span>
//         <span className="text-slate-600">·</span>
//         <span
//           className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
//             isTemplate
//               ? "bg-amber-900/40 text-amber-300"
//               : "bg-blue-900/40 text-blue-300"
//           }`}
//         >
//           {msg.campaign.messageType}
//         </span>
//       </div>

//       {/* Bubble */}
//       <div
//         className={`max-w-[78%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed ${
//           isTemplate
//             ? "bg-amber-950/60 border border-amber-800/40 text-amber-50"
//             : "bg-blue-950/60 border border-blue-800/40 text-blue-50"
//         }`}
//       >
//         {msg.campaign.message}

//         {/* Template params */}
//         {isTemplate && params.length > 0 && (
//           <div className="mt-2 pt-2 border-t border-amber-700/30 flex flex-wrap gap-1.5">
//             {params.map((p, i) => (
//               <span
//                 key={i}
//                 className="text-[11px] bg-amber-800/40 text-amber-200 rounded px-2 py-0.5 font-mono"
//               >
//                 {`{{${i + 1}}}`} = {p}
//               </span>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Meta row */}
//       <div className="flex items-center gap-2 pr-1">
//         <StatusBadge status={msg.status} />
//         <span className="text-[11px] text-slate-600 font-mono">
//           {formatDate(msg.sentAt)} 
//         </span>
//         {msg.retryCount > 0 && (
//           <span className="text-[11px] bg-red-900/30 text-red-400 rounded px-1.5 py-0.5 font-mono">
//             ↺ {msg.retryCount} retry
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }





// components/messagescompontents/Messagebubble.tsx
// components/messagescompontents/Messagebubble.tsx
// components/messagescompontents/Messagebubble.tsx
import { Message } from "@/lib/chatsandmessages/types";

const STATUS_ICON: Record<string, string> = {
  PENDING:   "○",
  SENT:      "✓",
  DELIVERED: "✓✓",
  READ:      "✓✓",
  FAILED:    "✗",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "text-slate-400",
  SENT:      "text-slate-400",
  DELIVERED: "text-blue-400",
  READ:      "text-teal-400",
  FAILED:    "text-red-400",
};

const STATUS_LABEL_COLOR: Record<string, string> = {
  PENDING:   "text-slate-400",
  SENT:      "text-slate-400",
  DELIVERED: "text-blue-400",
  READ:      "text-teal-500",
  FAILED:    "text-red-500",
};

function formatTime(ts: string | null) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveTemplateBody(bodyText: string, paramsJson: string | null): string {
  if (!paramsJson) return bodyText;
  try {
    const params: string[] = JSON.parse(paramsJson);
    let resolved = bodyText;
    params.forEach((val, i) => {
      resolved = resolved.replace(`{{${i + 1}}}`, val);
    });
    return resolved;
  } catch {
    return bodyText;
  }
}

function getOutboundContent(msg: Message): string {
  if (msg.body) return msg.body;
  const campaign = msg.campaign;
  if (!campaign) return "";
  if (campaign.messageType === "TEMPLATE") {
    const body = campaign.message || "";
    if (body) return resolveTemplateBody(body, campaign.templateParams);
    return `Template: ${campaign.templateName}`;
  }
  return campaign.message || "";
}

function getProxyUrl(mediaId: string | null): string | null {
  if (!mediaId) return null;
  return `/api/whatsapp/media/${mediaId}`;
}

export function MessageBubble({ msg }: { msg: Message }) {
  const isInbound = msg.direction === "INBOUND";
  const textContent = isInbound ? msg.body : getOutboundContent(msg);
  const hasMedia = !!msg.mediaType && !!msg.mediaId;

  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[70%] flex flex-col gap-1 ${
          isInbound ? "items-start" : "items-end"
        }`}
      >
        {/* Campaign tag — outbound only, no body */}
        {!isInbound && msg.campaign && !msg.body && (
          <span className="text-[10px] text-slate-400 font-mono px-1">
            {msg.campaign.messageType === "TEMPLATE"
              ? `📋 ${msg.campaign.templateName}`
              : `📢 ${msg.campaign.name}`}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`text-sm leading-relaxed whitespace-pre-wrap rounded-2xl px-4 py-2.5 ${
            isInbound
              ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
              : "bg-teal-700 text-white rounded-tr-sm"
          }`}
        >
          {/* Image */}
          {msg.mediaType === "image" && msg.mediaId && (
            <img
              src={getProxyUrl(msg.mediaId)!}
              alt="Image"
              onClick={() => {
                const url = getProxyUrl(msg.mediaId!);
                if (url) window.open(url, "_blank");
              }}
              className="max-w-full rounded-lg cursor-pointer block"
              style={{ maxHeight: 260, marginBottom: textContent ? 8 : 0 }}
            />
          )}

          {/* Video */}
          {msg.mediaType === "video" && msg.mediaId && (
            <video
              controls
              src={getProxyUrl(msg.mediaId)!}
              className="max-w-full rounded-lg block"
              style={{ maxHeight: 260, marginBottom: textContent ? 8 : 0 }}
            />
          )}

          {/* Audio */}
          {msg.mediaType === "audio" && msg.mediaId && (
            <audio
              controls
              src={getProxyUrl(msg.mediaId)!}
              className="w-full"
              style={{ marginBottom: textContent ? 8 : 0 }}
            />
          )}

          {/* Document */}
          {msg.mediaType === "document" && msg.mediaId && (
            <a
              href={getProxyUrl(msg.mediaId)!}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 no-underline ${
                isInbound
                  ? "bg-slate-100 text-slate-700"
                  : "bg-teal-800/50 text-teal-100"
              }`}
              style={{ marginBottom: textContent ? 8 : 0 }}
            >
              <span className="text-lg">📄</span>
              <span className="text-xs font-medium truncate max-w-[180px]">
                {msg.mediaName || "Document"}
              </span>
              <svg
                className="w-3 h-3 opacity-60 flex-shrink-0 ml-auto"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M4 8h8M10 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}

          {/* Text / caption */}
          {textContent && <p style={{ margin: 0 }}>{textContent}</p>}

          {/* Empty state */}
          {!textContent && !hasMedia && (
            <p className="opacity-40" style={{ margin: 0 }}>
              —
            </p>
          )}
        </div>

        {/* Time + Status */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] text-slate-400 font-mono">{formatTime(msg.sentAt)}</span>
          {!isInbound && (
            <>
              <span className={`text-[11px] font-bold leading-none ${STATUS_COLOR[msg.status]}`}>
                {STATUS_ICON[msg.status]}
              </span>
              <span className={`text-[10px] font-mono ${STATUS_LABEL_COLOR[msg.status]}`}>
                {msg.status}
              </span>
            </>
          )}
        </div>

        {/* Error reason */}
        {msg.errorReason && (
          <p className="text-[10px] text-red-400 font-mono px-1">⚠ {msg.errorReason}</p>
        )}
      </div>
    </div>
  );
}