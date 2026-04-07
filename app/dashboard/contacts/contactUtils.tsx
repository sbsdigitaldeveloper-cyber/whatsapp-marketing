export interface Contact {
      id: string 
  name?: string
  phone: string
  [key: string]: any
}

// Clean phone number (remove spaces, +, -, etc.)
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

// Validate phone (10–15 digits)
export function isValidPhone(phone: string): boolean {
  return /^\d{10,15}$/.test(phone)
}

// Remove duplicates based on phone
export function removeDuplicates(contacts: Contact[]): Contact[] {
  const seen = new Set<string>()

  return contacts.filter((contact) => {
    if (seen.has(contact.phone)) return false
    seen.add(contact.phone)
    return true
  })
}






