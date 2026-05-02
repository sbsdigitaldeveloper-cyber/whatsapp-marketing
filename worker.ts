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
import { Worker, Job } from "bullmq";
import { prisma } from "./lib/prisma";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env" : ".env.local",
});

// ---------------------------------------------------------
// Campaign-level cache
// ---------------------------------------------------------
const templateCache = new Map<number, any[] | null>();

// ---------------------------------------------------------
// WhatsApp API Call
// ---------------------------------------------------------
async function callWhatsAppAPI(payload: object, phoneId: string, token: string) {
  const version = process.env.WHATSAPP_VERSION || "v21.0";
  const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "WhatsApp API Error");
  }
  return data;
}

// ---------------------------------------------------------
// Universal Payload Builder — Fixed for all Meta Templates
// ---------------------------------------------------------
function buildUniversalPayload(phone: string, campaign: any, templateComponents: any[]) {
  const components: any[] = [];
  
  const safeParse = (str: string) => {
    try { return str ? JSON.parse(str) : []; } 
    catch { return []; }
  };

  const bodyInputs = safeParse(campaign.templateParams);
  const headerInputs = safeParse(campaign.templateHeaderParams);
  const buttonInputs = safeParse(campaign.templateButtonParams);

  templateComponents.forEach((comp) => {
    // 1. HEADER Handling
    if (comp.type === "HEADER") {
      const headerParams: any[] = [];
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(comp.format)) {
        if (campaign.templateHeaderMediaUrl) {
          const typeKey = comp.format.toLowerCase();
          headerParams.push({
            type: typeKey,
            [typeKey]: { link: campaign.templateHeaderMediaUrl }
          });
        }
      } 
      else if (comp.format === "TEXT" && comp.text?.includes("{{")) {
        const varNames = comp.text.match(/\{\{(\w+)\}\}/g)?.map((v: string) => v.replace(/\{\{|\}\}/g, "")) || [];
        headerInputs.forEach((val: string, i: number) => {
          headerParams.push({
            type: "text",
            text: val,
            ...(varNames[i] ? { parameter_name: varNames[i] } : {})
          });
        });
      }
      if (headerParams.length > 0) components.push({ type: "header", parameters: headerParams });
    }

    // 2. BODY Handling (Supports Named Params like {{sbs}})
    else if (comp.type === "BODY") {
      const varNames = comp.text?.match(/\{\{(\w+)\}\}/g)?.map((v: string) => v.replace(/\{\{|\}\}/g, "")) || [];
      const bodyParams = bodyInputs.map((val: string, i: number) => ({
        type: "text",
        text: val,
        ...(varNames[i] ? { parameter_name: varNames[i] } : {})
      }));
      if (bodyParams.length > 0) components.push({ type: "body", parameters: bodyParams });
    }

    // 3. BUTTONS Handling (Only Dynamic URLs)
    else if (comp.type === "BUTTONS") {
      comp.buttons?.forEach((btn: any, index: number) => {
        if (btn.type === "URL" && btn.url?.includes("{{")) {
          const btnValue = buttonInputs[index];
          if (btnValue) {
            components.push({
              type: "button",
              sub_type: "url",
              index: String(index),
              parameters: [{ type: "text", text: btnValue }]
            });
          }
        }
      });
    }
  });

  return {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: campaign.templateName,
      language: { code: campaign.templateLanguage || "en" },
      components: components
    }
  };
}

// ---------------------------------------------------------
// Campaign Stats & Status Manager
// ---------------------------------------------------------
async function updateCampaignStatus(campaignId: number) {
  try {
    const allMessages = await prisma.message.findMany({
      where: { campaignId },
      select: { status: true },
    });

    const total = allMessages.length;
    const pendingCount = allMessages.filter((m) =>
      ["PENDING", "QUEUED"].includes(m.status)
    ).length;

    if (pendingCount === 0) {
      const failedCount = allMessages.filter((m) => m.status === "FAILED").length;
      const finalStatus =
        failedCount === total ? "FAILED"  :
        failedCount > 0       ? "PARTIAL" : "COMPLETED";

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: finalStatus },
      });

      console.log(`📊 Campaign ${campaignId} finished with status: ${finalStatus}`);
      templateCache.delete(campaignId);
    }
  } catch (err: any) {
    console.error("❌ Campaign status update error:", err.message);
  }
}

// ---------------------------------------------------------
// Worker Implementation
// ---------------------------------------------------------
const worker = new Worker(
  "whatsapp-messages",
  async (job: Job) => {
    const { messageId } = job.data;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        contact: true,
        campaign: true,
        user: { include: { whatsappConfig: true } },
      },
    });

    if (!message) return;

    if (!message.user.whatsappConfig || !message.user.whatsappConfig.isActive) {
      throw new Error("WhatsApp API not configured or inactive");
    }

    if (!message.contact?.optIn) {
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "FAILED", errorReason: "Contact opted out" },
      });
      return;
    }

    try {
      const { phoneNumberId, accessToken } = message.user.whatsappConfig;
      const campaignId = message.campaign?.id;

      let payload: object;

      // ── Handle Plain Text vs Template ──────────────────
      if (message.campaign?.messageType !== "TEMPLATE") {
        payload = {
          messaging_product: "whatsapp",
          to: message.contact.phone,
          type: "text",
          text: { body: message.campaign?.message || "" },
        };
      } else {
        // Template Logic
        let templateComponents: any[] = [];
        if (campaignId && templateCache.has(campaignId)) {
          templateComponents = templateCache.get(campaignId) || [];
        } else {
          templateComponents = message.campaign?.templateComponents
            ? JSON.parse(message.campaign.templateComponents)
            : [];
          if (campaignId) templateCache.set(campaignId, templateComponents);
        }

        payload = buildUniversalPayload(
          message.contact.phone,
          message.campaign,
          templateComponents
        );
      }

      // ── Send API Call ──────────────────────────────────
      const response = await callWhatsAppAPI(payload, phoneNumberId, accessToken);
      const waId = response?.messages?.[0]?.id;

      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          whatsappMsgId: waId,
          errorReason: null,
        },
      });

      console.log(`✅ Sent: Message ${messageId} to ${message.contact.phone}`);

    } catch (err: any) {
      console.error(`❌ Message ${messageId} failed:`, err.message);
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "FAILED", errorReason: err.message },
      });
      throw err;
    }
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
      db: 0,
    },
    concurrency: 10,
    limiter: { max: 20, duration: 1000 },
  }
);

// Worker Events
worker.on("completed", async (job) => {
  const msg = await prisma.message.findUnique({
    where: { id: job.data.messageId },
    select: { campaignId: true },
  });
  if (msg?.campaignId) await updateCampaignStatus(msg.campaignId);
});

worker.on("failed", async (job) => {
  if (job?.data?.messageId) {
    const msg = await prisma.message.findUnique({
      where: { id: job.data.messageId },
      select: { campaignId: true },
    });
    if (msg?.campaignId) await updateCampaignStatus(msg.campaignId);
  }
});

worker.on("drained", () => {
  console.log("☕ Queue is empty. Keeping worker alive...");
});

console.log("🚀 WhatsApp Worker is running on Local Redis (DB 0)");