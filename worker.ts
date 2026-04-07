// import dotenv from "dotenv";
// dotenv.config({ path: ".env.local" });

// import { Worker, Job } from "bullmq";
// import { prisma } from "./lib/prisma";

// const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
// const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID!;
// const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || "v18.0";

// // ---------------------------------------------------------
// // Helper: WhatsApp API Calls
// // ---------------------------------------------------------
// async function callWhatsAppAPI(payload: any) {
//   const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${PHONE_NUMBER_ID}/messages`;
//   const res = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${WHATSAPP_TOKEN}`,
//     },
//     body: JSON.stringify(payload),
//   });

//   const data = await res.json();
//   if (!res.ok) {
//     throw new Error(data?.error?.message || "WhatsApp API Error");
//   }
//   return data;
// }

// // ---------------------------------------------------------
// // Optimized Worker
// // ---------------------------------------------------------
// const worker = new Worker(
//   "whatsapp-messages",
//   async (job: Job) => {
//     const { messageId } = job.data;

//     // 1. Fetch only necessary fields to reduce DB load
//     const message = await prisma.message.findUnique({
//       where: { id: messageId },
//       include: { 
//         contact: { select: { phone: true, optIn: true } }, 
//         campaign: true 
//       },
//     });

//     if (!message || !message.contact || !message.campaign) return;
//     if (!message.contact.optIn) return; // Skip if opted out

//     try {
//       const { campaign, contact } = message;
//       let payload: any = {
//         messaging_product: "whatsapp",
//         to: contact.phone,
//       };

//       // 2. Routing Logic
//       if (campaign.messageType === "TEMPLATE") {
//         const params = campaign.templateParams ? JSON.parse(campaign.templateParams) : [];
//         payload = {
//           ...payload,
//           type: "template",
//           template: {
//             name: campaign.templateName,
//             language: { code: campaign.templateLanguage || "en" },
//             components: params.length > 0 ? [{
//               type: "body",
//               parameters: params.map((p: string) => ({ type: "text", text: p })),
//             }] : [],
//           },
//         };
//       } else {
//         payload = {
//           ...payload,
//           type: "text",
//           text: { body: campaign.message },
//         };
//       }

//       // 3. Send Message
//       const response = await callWhatsAppAPI(payload);
//       const waId = response?.messages?.[0]?.id;

//       // 4. Update Message Status (Fast Update)
//       await prisma.message.update({
//         where: { id: message.id },
//         data: {
//           status: "SENT",
//           sentAt: new Date(),
//           whatsappMsgId: waId,
//         },
//       });

//       console.log(`✅ Message ${messageId} sent. WA_ID: ${waId}`);

//     } catch (err: any) {
//       console.error(`❌ Job ${job.id} failed:`, err.message);
      
//       await prisma.message.update({
//         where: { id: message.id },
//         data: {
//           status: "FAILED",
//           errorReason: err.message,
//           retryCount: job.attemptsMade,
//         },
//       });

//       // Throw error so BullMQ can handle retries automatically
//       throw err; 
//     }
//   },
//   {
//     connection: { url: process.env.REDIS_URL! },
    
//     // --- UPSTASH & PERFORMANCE OPTIMIZATIONS ---
//     concurrency: 5,            // Ek saath 5 messages process honge
//     lockDuration: 30000,       // Job lock for 30s
    
//     // Upstash bill kam karne ke liye settings:
//     stalledInterval: 60000,    // Check for crashed jobs every 60s (not 1s)
//     maxStalledCount: 1,
    
//     // Rate Limiting (WhatsApp Compliance)
//     limiter: {
//       max: 10,                 // Max 10 messages
//       duration: 1000,          // Per 1 second
//     },
//   }
// );

// // ---------------------------------------------------------
// // Global Event Listeners
// // ---------------------------------------------------------
// worker.on("completed", (job) => {
//   // Yahan aap Campaign status update ka logic 10 jobs ke baad fire kar sakte hain
//   // taaki har single message par DB hit na ho.
// });

// worker.on("failed", (job, err) => {
//   console.log(`Final failure for job ${job?.id}: ${err.message}`);
// });

// console.log("🚀 Worker is optimized and running...");


// Above code is for worker is optimised hai.------ --------------- -----





//--------------------------   this code is first vesion of worker.ts ---------------------------------------------------

// import "dotenv/config";
// import dotenv from "dotenv";
// dotenv.config({ path: ".env.local" });

// import { Worker } from "bullmq";
// import { prisma } from "./lib/prisma";

// const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
// const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID!;
// const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || "v18.0";

// // ----------------------------------------
// // Send plain text message
// // ----------------------------------------
// async function sendWhatsAppMessage(phone: string, message: string) {
//   const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${PHONE_NUMBER_ID}/messages`;

//   const res = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${WHATSAPP_TOKEN}`,
//     },
//     body: JSON.stringify({
//       messaging_product: "whatsapp",
//       to: phone,
//       type: "text",
//       text: { body: message },
//     }),
//   });

//   if (!res.ok) {
//     const err = await res.json();
//     throw new Error(err.error?.message || "WhatsApp API failed");
//   }

//   return res.json();
// }

// // ----------------------------------------
// // Send approved template message
// // ----------------------------------------
// async function sendWhatsAppTemplateMessage(
//   phone: string,
//   templateName: string,
//   languageCode: string = "en",
//   params: string[] = []
// ) {
//   const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${PHONE_NUMBER_ID}/messages`;

//   const components =
//     params.length > 0
//       ? [
//           {
//             type: "body",
//             parameters: params.map((p) => ({
//               type: "text",
//               text: p,
//             })),
//           },
//         ]
//       : [];

//   const payload = {
//     messaging_product: "whatsapp",
//     to: phone,
//     type: "template",
//     template: {
//       name: templateName,
//       language: { code: languageCode },
//       ...(components.length > 0 && { components }),
//     },
//   };

//   console.log("📤 TEMPLATE REQUEST ------------------");
//   console.log("To:", phone);
//   console.log("Payload:", JSON.stringify(payload, null, 2));
//   console.log("--------------------------------------");

//   const res = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${WHATSAPP_TOKEN}`,
//     },
//     body: JSON.stringify(payload),
//   });

//   const responseBody = await res.json();

//   console.log("📥 TEMPLATE RESPONSE -----------------");
//   console.log("Status:", res.status);
//   console.log("Response:", JSON.stringify(responseBody, null, 2));
//   console.log("--------------------------------------");

//   if (!res.ok) {
//     console.error("❌ TEMPLATE ERROR FULL OBJECT:");
//     console.error(JSON.stringify(responseBody, null, 2));
//     throw new Error(responseBody?.error?.message || "WhatsApp template API failed");
//   }

//   return responseBody;
// }

// // ----------------------------------------
// // Worker
// // ----------------------------------------
// const worker = new Worker(
//   "whatsapp-messages",
//   async (job) => {
//     const { messageId } = job.data;

//     const message = await prisma.message.findUnique({
//       where: { id: messageId },
//       include: { contact: true, campaign: true },
//     });

//     if (!message) {
//       console.error("Message not found:", messageId);
//       return;
//     }

//     if (!message.contact || !message.campaign) {
//       console.error("Contact or Campaign not found for message:", messageId);
//       return;
//     }

//     if (!message.contact.optIn) {
//       console.log(`Contact ${message.contact.phone} opted out, skipping`);
//       return;
//     }

//     // Rate limiting delay
//     await new Promise((r) => setTimeout(r, 5000));

//     try {
//       const { campaign, contact } = message;
//       let waMessageId: string | null = null;

//       // ----------------------------------------
//       // Route to correct send function
//       // ----------------------------------------
//       if (campaign.messageType === "TEMPLATE") {

//         if (!campaign.templateName) {
//           throw new Error("Template name is missing in campaign");
//         }

//         // Parse templateParams — stored as JSON string in SQL Server
//         let params: string[] = [];
//         if (campaign.templateParams) {
//           try {
//             params = JSON.parse(campaign.templateParams);
//           } catch {
//             console.warn("Failed to parse templateParams, using empty array");
//           }
//         }

//         const response = await sendWhatsAppTemplateMessage(
//           contact.phone,
//           campaign.templateName,
//           campaign.templateLanguage ?? "en",
//           params
//         );

//         waMessageId = response?.messages?.[0]?.id ?? null;
//         console.log(`✅ Template sent to ${contact.phone} | wamid: ${waMessageId}`);

//       } else {
//         // Default: plain TEXT message
//         const response = await sendWhatsAppMessage(
//           contact.phone,
//           campaign.message
//         );

//         waMessageId = response?.messages?.[0]?.id ?? null;
//         console.log(`✅ Text sent to ${contact.phone} | wamid: ${waMessageId}`);
//       }

//       // Mark as SENT
//       await prisma.message.update({
//         where: { id: message.id },
//         data: {
//           status: "SENT",
//           sentAt: new Date(),
//           whatsappMsgId: waMessageId,  // 👈 add karo
        
//         },
//       });

//       // Update campaign status when all messages are processed
//       const pendingCount = await prisma.message.count({
//         where: { campaignId: message.campaignId, status: "PENDING" },
//       });

//       if (pendingCount === 0) {
//         const failedCount = await prisma.message.count({
//           where: { campaignId: message.campaignId, status: "FAILED" },
//         });

//         await prisma.campaign.update({
//           where: { id: message.campaignId },
//           data: { status: failedCount === 0 ? "SENT" : "PARTIAL" },
//         });

//         console.log(`📊 Campaign ${message.campaignId} done — failed: ${failedCount}`);
//       }

//     } catch (err) {
//       const errorMsg = err instanceof Error ? err.message : "Unknown error";
//       console.error(`❌ Message ${messageId} failed:`, errorMsg);

//       await prisma.message.update({
//         where: { id: message.id },
//         data: {
//           status: "FAILED",
//           retryCount: message.retryCount + 1,
//           errorReason: errorMsg,  // 👈 add karo
  
//         },
//       });

//       throw err;
//     }
//   },
//   {
//     connection: { url: process.env.REDIS_URL! },
//     concurrency: 1,
//   }
// );

// worker.on("failed", (job, err) => {
//   console.error(`Job ${job?.id} failed:`, err.message);
// });

// worker.on("completed", (job) => {
//   console.log(`Job ${job.id} completed`);
// });

// console.log("🚀 Worker running...");







//-------------------------- ------------------------    This is Worker Code is Updated and Focus on Cost Saving of Upstash and  500 message we send daily  target  -- it is v3 of worker .ts 


// ------------- --------------------------------------


import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Worker, Job } from "bullmq";
import { prisma } from "./lib/prisma";

const WHATSAPP_TOKEN    = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID   = process.env.PHONE_NUMBER_ID!;
const WHATSAPP_VERSION  = process.env.WHATSAPP_VERSION || "v18.0";
const WA_URL            = `https://graph.facebook.com/${WHATSAPP_VERSION}/${PHONE_NUMBER_ID}/messages`;

// ---------------------------------------------------------
// WhatsApp API — reuse headers object (minor but clean)
// ---------------------------------------------------------
const WA_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${WHATSAPP_TOKEN}`,
};

async function callWhatsAppAPI(payload: object) {
  const res  = await fetch(WA_URL, { method: "POST", headers: WA_HEADERS, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "WhatsApp API Error");
  return data;
}

// ---------------------------------------------------------
// Build WhatsApp payload — pure function, no DB call
// ---------------------------------------------------------
function buildPayload(phone: string, campaign: {
  messageType: string;
  templateName?: string | null;
  templateLanguage?: string | null;
  templateParams?: string | null;
  message?: string | null;
}) {
  const base = { messaging_product: "whatsapp", to: phone };

  if (campaign.messageType === "TEMPLATE") {
    const params = campaign.templateParams ? JSON.parse(campaign.templateParams) : [];
    return {
      ...base,
      type: "template",
      template: {
        name: campaign.templateName,
        language: { code: campaign.templateLanguage || "en" },
        components: params.length > 0
          ? [{ type: "body", parameters: params.map((p: string) => ({ type: "text", text: p })) }]
          : [],
      },
    };
  }

  return { ...base, type: "text", text: { body: campaign.message } };
}

// ---------------------------------------------------------
// Worker
// ---------------------------------------------------------
const worker = new Worker(
  "whatsapp-messages",
  async (job: Job) => {
    const { messageId } = job.data;

    // Single DB query — select only what's needed
    const message = await prisma.message.findUnique({
      where:   { id: messageId },
      select: {
        id:      true,
        contact: { select: { phone: true, optIn: true } },
        campaign: {
          select: {
            messageType:      true,
            templateName:     true,
            templateLanguage: true,
            templateParams:   true,
            message:          true,
          },
        },
      },
    });

    // Guard: missing data or opted out — silently skip, don't throw
    // (throwing would waste a retry attempt)
    if (!message?.contact || !message?.campaign) {
      console.warn(`⚠️  Message ${messageId} missing contact/campaign — skipping`);
      return;
    }
    if (!message.contact.optIn) {
      // Mark failed cleanly so UI shows correct status
      await prisma.message.update({
        where: { id: messageId },
        data:  { status: "FAILED", errorReason: "Contact opted out" },
      });
      return;
    }

    try {
      const payload  = buildPayload(message.contact.phone, message.campaign);
      const response = await callWhatsAppAPI(payload);
      const waId     = response?.messages?.[0]?.id;

      await prisma.message.update({
        where: { id: messageId },
        data:  { status: "SENT", sentAt: new Date(), whatsappMsgId: waId },
      });

      console.log(`✅ Message ${messageId} sent — WA_ID: ${waId}`);

    } catch (err: any) {
      console.error(`❌ Job ${job.id} failed:`, err.message);

      await prisma.message.update({
        where: { id: messageId },
        data:  { status: "FAILED", errorReason: err.message, retryCount: job.attemptsMade },
      });

      // Re-throw so BullMQ retries (exponential backoff kicks in)
      throw err;
    }
  },
  {
    connection: {
      url:                  process.env.REDIS_URL!,
      enableOfflineQueue:   false,   // Upstash ke liye — offline commands queue mat karo
      maxRetriesPerRequest: 3,
    },

    // ── Concurrency ──────────────────────────────────────
    // 500 contacts / ~50s = 10/s target
    // WhatsApp allows ~80 msg/s but keep 10 for safety
    concurrency: 10,

    // ── Lock ─────────────────────────────────────────────
    // 30s kaafi hai for a single WA API call + DB update
    lockDuration:      30_000,
    // lockRenewTime default = lockDuration/2 = 15s — fine

    // ── Stalled job detection ─────────────────────────────
    // Default 30s pe BullMQ Upstash pe bahut zyada commands chalata hai.
    // 5 min rakh do — agent reply flow pe koi fark nahi padta
    stalledInterval:   300_000,   // 5 minutes (default: 30s)
    maxStalledCount:   1,

    // ── Rate Limiter ──────────────────────────────────────
    // WhatsApp Business API: 80 msg/s for most tiers
    // Conservatively 20/s rakh rahe hain
    limiter: {
      max:      20,
      duration: 1000,
    },
  }
);

// ---------------------------------------------------------
// Events
// ---------------------------------------------------------
worker.on("completed", (job) => {
  // Campaign completion check yahan mat karo per-job —
  // ek alag scheduled job ya webhook se karo to avoid N DB hits
});

worker.on("failed", (job, err) => {
  console.error(`💀 Final failure — job ${job?.id}: ${err.message}`);
});

worker.on("error", (err) => {
  // Redis connection errors etc.
  console.error("Worker error:", err.message);
});

console.log("🚀 Worker running — concurrency:10, rate:20/s, stalledInterval:5min");

