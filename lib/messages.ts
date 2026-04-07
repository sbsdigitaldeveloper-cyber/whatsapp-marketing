// lib/messages.ts
export interface Message {
  id: number;
  from: string; // "ME" for sent messages, phone number for received
  text: string;
  timestamp: string;
}

let messages: Message[] = [];
let idCounter = 1;

// Add a message to store
export function addMessage(msg: Omit<Message, "id">) {
  const newMsg = { id: idCounter++, ...msg };
  messages.push(newMsg);
  return newMsg;
}

// Get all messages
export function getMessages() {
  return messages;
}

// Clear messages
export function clearMessages() {
  messages = [];
}
