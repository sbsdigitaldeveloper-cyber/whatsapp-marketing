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

/**
 * Redis Connection Configuration
 * Hum local Redis (127.0.0.1) use kar rahe hain DB 0 par.
 */
const connection = {
  host: "127.0.0.1",
  port: 6379,
  db: 0,
  maxRetriesPerRequest: null, // BullMQ ke liye ye null hona zaroori hai
};

/**
 * WhatsApp Message Queue Definition
 */
export const whatsappQueue = new Queue("whatsapp-messages", {
  connection,
  defaultJobOptions: {
    attempts: 3, // Agar fail ho toh 3 baar koshish karega
    backoff: {
      type: "exponential",
      delay: 5000, // Pehla retry 5s, fir 10s, fir 20s...
    },
    removeOnComplete: {
      count: 100, // Memory bachane ke liye sirf last 100 successful jobs rakhega
    },
    removeOnFail: {
      count: 500, // Failed jobs ka record 500 tak rakhega debugging ke liye
    },
  },
});

/**
 * Bulk Messages ko Queue mein daalne ke liye Helper Function
 * @param messageIds - Database se generate hui Message IDs ka array
 */
export async function enqueueBulkMessages(messageIds: number[]) {
  try {
    const jobs = messageIds.map((id) => ({
      name: "send-message",
      data: { messageId: id },
      opts: {
        // jobId unique rakha hai taaki agar galti se same batch 
        // dobara trigger ho toh duplicate messages na jayein
        jobId: `msg-${id}`, 
      },
    }));

    // addBulk single call mein saare jobs Redis mein bhej deta hai (Very Fast)
    const result = await whatsappQueue.addBulk(jobs);
    
    console.log(`🚀 Enqueued ${result.length} messages to Redis.`);
    return result;
  } catch (error) {
    console.error("❌ Failed to enqueue bulk messages:", error);
    throw error;
  }
}