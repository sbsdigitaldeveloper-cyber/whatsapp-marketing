// lib/contacts.ts
export interface Contact {
  id: number;
  name: string;
  phone: string;
}

let contacts: Contact[] = [];
let idCounter = 1;

export function addContact(contact: Omit<Contact, "id">) {
  const newContact = { id: idCounter++, ...contact };
  contacts.push(newContact);
  return newContact;
}

export function getContacts() {
  return contacts;
}

export function removeContact(id: number) {
  contacts = contacts.filter((c) => c.id !== id);
}

export function clearContacts() {
  contacts = [];
}
