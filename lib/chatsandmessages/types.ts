export type MessageStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "READ";
export type MessageDirection = "INBOUND" | "OUTBOUND";

export interface Campaign {
  id: number;
  name: string;
  messageType: "TEXT" | "TEMPLATE";
  message: string;
  templateName: string | null;
  templateParams: string | null;
  status: string;
}

// export interface Message {
//   id: number;
//   status: MessageStatus;
//   sentAt: string | null;
//   retryCount: number;
//   campaign: Campaign;
// }

export interface Message {
  id:          number;
  status:      MessageStatus;
  direction:   MessageDirection;  // 👈
  body:        string | null;     // 👈 reply text
  sentAt:      string | null;
  deliveredAt: string | null;     // 👈
  readAt:      string | null;     // 👈
  retryCount:  number;
  errorReason: string | null;     // 👈
  campaign:    Campaign | null;
   mediaId:   string | null;
  mediaType: string | null;  // "image" | "video" | "document" | "audio"
  mediaUrl:  string | null;
  mediaName: string | null;
}

export interface Contact {
  id: number;
  name: string | null;
  phone: string;
  optIn: boolean;
  createdAt: string;
  messageCount: number;
   lastMessage:  Message | null;  // 👈 yeh add karo
   assignedAgentId? :number |null ;
  messages: Message[];
}

export interface MessagesApiResponse {
  contacts: Contact[];
  stats: {
    totalContacts: number;
    totalMessages: number;
    byStatus: Record<string, number>;
  };
}