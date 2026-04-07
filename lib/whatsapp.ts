// lib/whatsapp.ts
import axios from "axios";

export async function sendWhatsAppMessage(phone: string, templateName: string) {
  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        // template: {
        //   name: templateName,
        //   language: { code: "en" },
        // },
        
  "text": {
    "body": "Hello, Sandy  this is api testing"}
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("WhatsApp send error:", error.response?.data || error.message);
    return { error: error.response?.data || error.message };
  }
}
