"use client"

import Papa from "papaparse"
import { v4 as uuidv4 } from "uuid"
import { cleanPhone, Contact, isValidPhone, removeDuplicates } from "./contactUtils"

interface Props {
  onUpload: (contacts: Contact[]) => void
}

export default function UploadContacts({ onUpload }: Props) {

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
  header: false,       // no header row
  skipEmptyLines: true,
  complete: (results) => {
    // results.data is an array of arrays [[name, phone], [name, phone]]
    const uploaded: Contact[] = (results.data as string[][]).map(([name, phone]) => ({
      id: crypto.randomUUID(),
      name: name?.trim(),
      phone: phone?.trim(),
    }));

    // Clean phone, validate, remove duplicates
    let processed = uploaded.map(c => ({ ...c, phone: cleanPhone(c.phone) }));
    processed = processed.filter(c => isValidPhone(c.phone));
    processed = removeDuplicates(processed);

    onUpload(processed);
  },
});

  }

  return (
    <div className="mb-6">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="border p-2"
      />
    </div>
  )
}
