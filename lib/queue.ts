// import { Queue } from "bullmq";

// export const whatsappQueue = new Queue("whatsapp-messages", {
//   connection: {
//     url: process.env.REDIS_URL!,
//   },
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: { type: "exponential", delay: 5000 },
//     removeOnComplete: true,
//     removeOnFail: { count: 100 },
//   },
// });






import { Queue } from "bullmq";

// Upstash Redis ke liye optimized connection
const connection = {
  url: process.env.REDIS_URL!,
  // Upstash ke saath ye zaroori hai - persistent connection nahi rakhta
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
};

export const whatsappQueue = new Queue("whatsapp-messages", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },

    // ✅ Upstash commands bachane ke liye:
    // removeOnComplete: true ke bajaye count limit rakho
    // Warna BullMQ har complete pe ZREM + LREM dono chalata hai
    removeOnComplete: { count: 50 },   // sirf last 50 completed jobs rakho
    removeOnFail: { count: 100 },      // last 100 failed jobs rakho

    // ❌ delay mat rakho jab zaroorat na ho — unnecessary ZADD commands badhte hain
  },
});

// ---------------------------------------------------------
// Bulk enqueue — 500 contacts ke liye ek loop se add karo
// Ek ek addJob() ke bajaye addBulk() use karo = 1 pipeline = ~10x kam commands
// ---------------------------------------------------------
export async function enqueueBulkMessages(messageIds: number[]) {
  const jobs = messageIds.map((messageId) => ({
    name: "send-whatsapp",
    data: { messageId },
    opts: {
      // jobId deduplicate karta hai — same message dobara queue mein nahi jayega
      jobId: `msg-${messageId}`,
    },
  }));

  // addBulk = single Redis pipeline = bahut kam commands
  await whatsappQueue.addBulk(jobs);
}