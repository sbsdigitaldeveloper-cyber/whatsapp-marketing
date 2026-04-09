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

const connection = {
  url: process.env.REDIS_URL!,
  enableOfflineQueue: false,
  maxRetriesPerRequest: null,  // ✅ BullMQ ke liye null hona chahiye
};

export const whatsappQueue = new Queue("whatsapp-messages", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export async function enqueueBulkMessages(messageIds: number[]) {
  const jobs = messageIds.map((messageId) => ({
    name: "send-message",  // ✅ worker.ts se match karo
    data: { messageId },
    opts: {
      jobId: `msg-${messageId}`,  // ✅ duplicate prevent
    },
  }));

  await whatsappQueue.addBulk(jobs);
}