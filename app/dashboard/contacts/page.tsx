// "use client";

// import { useState, useEffect } from "react";
// import ContactTable from "./ContactTable";
// import UploadContacts from "./UploadContacts";

// interface Contact {
//   id: number;
//   name: string;
//   phone: string;
// }

// export default function ContactsPage() {
//   const [contactsInput, setContactsInput] = useState(""); // for multiple contacts
//   const [contacts, setContacts] = useState<Contact[]>([]);
//   const [message, setMessage] = useState("");
//    const [uploadcontacts, setUploadContacts] = useState<Contact[]>([])

//   // Load contacts from local storage on mount
//   useEffect(() => {
//     const stored = localStorage.getItem("contacts");
//     if (stored) setContacts(JSON.parse(stored));
//   }, []);

//   // Update local storage whenever contacts change
//   useEffect(() => {
//     localStorage.setItem("contacts", JSON.stringify(contacts));
//   }, [contacts]);

//   // Add contacts (single or multiple)
//   const addContacts = async () => {
//     if (!contactsInput.trim()) return setMessage("Please enter contact(s)");

//     // Split by line and parse "name,phone"
//     const lines = contactsInput
//       .split("\n")
//       .map((line) => line.trim())
//       .filter(Boolean);

//     const newContacts = lines.map((line) => {
//       const [name, phone] = line.split(",").map((v) => v.trim());
//       return { name, phone };
//     });

//     // Send to backend API (IBS)
//     const res = await fetch("/api/contacts/add", {
//       method: "POST",
//       body: JSON.stringify(newContacts),
//     });

//     const data = await res.json();

//     if (data.success) {
//       setContacts(data.allContacts); // update UI immediately
//       setMessage(`${data.addedContacts.length} contact(s) added!`);
//       setContactsInput(""); // clear textarea
//     } else {
//       setMessage(data.error);
//     }
//   };

//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Contacts</h1>

//       <p>Enter contacts, one per line: <b>name,phone</b></p>
//       <textarea
//         className="border p-2 w-full h-32 mb-2"
//         placeholder="John,919999999999&#10;Mike,918888888888"
//         value={contactsInput}
//         onChange={(e) => setContactsInput(e.target.value)}
//       ></textarea>

//       <button
//         onClick={addContacts}
//         className="bg-blue-500 text-white px-4 py-2 mb-4"
//       >
//         Add Contact(s)
//       </button>

//       {message && <div className="mb-4 text-green-700">{message}</div>}

//       <h2 className="text-xl font-semibold mb-2">All Contacts ({contacts.length})</h2>
//       <ul>
//         {contacts.map((c) => (
//           <li key={c.id}>
//             {c.name} - {c.phone}
//           </li>
//         ))}
//       </ul>

//        <h1 className="text-2xl font-bold mb-6">Upload Contacts</h1>

//       <UploadContacts onUpload={setUploadContacts} />

//       <ContactTable contacts={contacts} />



//     </div>
//   );
// }



// "use client";

// import { useState, useEffect } from "react";
// import ContactTable from "./ContactTable";
// import UploadContacts from "./UploadContacts";

// export interface Contact {
//   id: string; // UUID string now, not number
//   name?: string;
//   phone: string;
// }

// export default function ContactsPage() {
//   const [contactsInput, setContactsInput] = useState(""); // manual input
//   const [contacts, setContacts] = useState<Contact[]>([]); // all contacts
//   const [message, setMessage] = useState("");

//   // Load contacts from local storage
//   useEffect(() => {
//     const stored = localStorage.getItem("contacts");
//     if (stored) setContacts(JSON.parse(stored));
//   }, []);

//   // Save contacts to local storage
//   useEffect(() => {
//     localStorage.setItem("contacts", JSON.stringify(contacts));
//   }, [contacts]);

//   // Add contacts from textarea
//   const addContacts = async () => {
//     if (!contactsInput.trim()) return setMessage("Please enter contact(s)");

//     const lines = contactsInput
//       .split("\n")
//       .map((line) => line.trim())
//       .filter(Boolean);

//     const newContacts: Contact[] = lines.map((line) => {
//       const [name, phone] = line.split(",").map((v) => v.trim());
//       return { id: crypto.randomUUID(), name, phone }; // generate UUID for manual input
//     });

//     // For MVP, we can just update local state
//     setContacts((prev) => [...prev, ...newContacts]);
//     setMessage(`${newContacts.length} contact(s) added!`);
//     setContactsInput("");
//   };

//   // Handler for UploadContacts
//   const handleUpload = (uploaded: Contact[]) => {
//     setContacts((prev) => [...prev, ...uploaded]);
//     setMessage(`${uploaded.length} contact(s) uploaded!`);
//   };

//   return (
//     <div className="p-8">
//       <h1 className="text-2xl font-bold mb-4">Contacts</h1>

//       <p>Enter contacts, one per line: <b>name,phone</b></p>
//       <textarea
//         className="border p-2 w-full h-32 mb-2"
//         placeholder="John,919999999999&#10;Mike,918888888888"
//         value={contactsInput}
//         onChange={(e) => setContactsInput(e.target.value)}
//       />

//       <button
//         onClick={addContacts}
//         className="bg-blue-500 text-white px-4 py-2 mb-4"
//       >
//         Add Contact(s)
//       </button>

//       {message && <div className="mb-4 text-green-700">{message}</div>}

//       <h2 className="text-xl font-semibold mb-2">All Contacts ({contacts.length})</h2>
//       <ContactTable contacts={contacts} />

//       <h1 className="text-2xl font-bold mt-8 mb-4">Upload Contacts</h1>
//       <UploadContacts onUpload={handleUpload} />
//     </div>
//   );
// }






"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Contact } from "./contactUtils";

export default function WhatsAppCampaignPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  const [csvPreview, setCsvPreview] = useState<Contact[]>([]);
  const [csvSelected, setCsvSelected] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addMethod, setAddMethod] = useState<"manual" | "csv" | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [campaignMsg, setCampaignMsg] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [activeTab, setActiveTab] = useState<"contacts" | "campaign">("contacts");
  const [sendResults, setSendResults] = useState<any>(null);

  const showMessage = (msg: string, type: "success" | "error" | "info" = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  // ✅ Shared fetch options — cookie sent automatically
  const fetchOptions = {
    credentials: "include" as const,
    headers: { "Content-Type": "application/json" },
    // ❌ No Authorization header needed anymore
  };

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts", fetchOptions);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      } else {
        showMessage("Failed to load contacts", "error");
      }
    } catch {
      showMessage("Network error while loading contacts", "error");
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const addManualContact = async () => {
    if (!manualPhone.trim()) return showMessage("Phone number is required", "error");
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        ...fetchOptions, // ✅ credentials: include
        body: JSON.stringify({
          contacts: [{ name: manualName.trim() || undefined, phone: manualPhone.trim() }],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Contact added successfully!", "success");
        setManualName("");
        setManualPhone("");
        loadContacts();
      } else {
        showMessage(data.error || "Failed to add contact", "error");
      }
    } catch {
      showMessage("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const start =
        lines[0]?.toLowerCase().includes("name") || lines[0]?.toLowerCase().includes("phone") ? 1 : 0;
      const parsed: Contact[] = lines
        .slice(start)
        .map((line, i) => {
          const [name, phone] = line.split(",").map((v) => v.trim());
          return { id: `csv-${i}`, name: name || undefined, phone: phone || name };
        })
        .filter((c) => c.phone);
      setCsvPreview(parsed);
      setCsvSelected(parsed.map((c) => c.id));
      showMessage(`${parsed.length} contacts found in CSV`, "info");
    };
    reader.readAsText(file);
  };

  const saveCsvContacts = async () => {
    const toSave = csvPreview.filter((c) => csvSelected.includes(c.id));
    if (!toSave.length) return showMessage("Select at least one contact", "error");
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        ...fetchOptions, // ✅ credentials: include
        body: JSON.stringify({ contacts: toSave.map(({ name, phone }) => ({ name, phone })) }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(`${toSave.length} contacts imported successfully!`, "success");
        setCsvPreview([]);
        setCsvSelected([]);
        setCsvFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setAddMethod(null);
        loadContacts();
      } else {
        showMessage(data.error || "Failed to import contacts", "error");
      }
    } catch {
      showMessage("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    try {
      await fetch("/api/contacts", {
        method: "DELETE",
        ...fetchOptions, // ✅ credentials: include
        body: JSON.stringify({ id }),
      });
      loadContacts();
      setSelected(selected.filter((s) => s !== id));
      showMessage("Contact deleted", "success");
    } catch {
      showMessage("Failed to delete", "error");
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () =>
    setSelected(selected.length === contacts.length ? [] : contacts.map((c) => c.id));

  const toggleCsvSelect = (id: string) =>
    setCsvSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const sendCampaign = async () => {
    if (!campaignName.trim()) return showMessage("Campaign name required", "error");
    if (!campaignMsg.trim()) return showMessage("Message required", "error");
    if (!selected.length) return showMessage("Select at least one contact", "error");
    setLoading(true);
    setSendResults(null);
    showMessage(`Creating campaign with ${selected.length} contacts...`, "info");
    try {
      // ✅ No Authorization header — cookie handles auth
      const campaignRes = await fetch("/api/campaign", {
        method: "POST",
        ...fetchOptions,
        body: JSON.stringify({ name: campaignName, message: campaignMsg, contactIds: selected }),
      });
      const campaign = await campaignRes.json();
      if (!campaign.id) {
        showMessage(campaign.error || "Failed to create campaign", "error");
        setLoading(false);
        return;
      }

      const bulkRes = await fetch("/api/messages/bulk", {
        method: "POST",
        ...fetchOptions, // ✅ credentials: include
        body: JSON.stringify({ campaignId: campaign.id }),
      });
      const result = await bulkRes.json();
      if (result.success) {
        setSendResults(result);
        showMessage(`✅ Sent: ${result.sent} | Failed: ${result.failed}`, "success");
        setCampaignName("");
        setCampaignMsg("");
        setSelected([]);
      } else {
        showMessage(result.error || "Failed to send messages", "error");
      }
    } catch {
      showMessage("Network error while sending campaign", "error");
    } finally {
      setLoading(false);
    }
  };

  const alertStyles = {
    success: "bg-emerald-50 border border-emerald-200 text-emerald-800",
    error: "bg-red-50 border border-red-200 text-red-800",
    info: "bg-blue-50 border border-blue-200 text-blue-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-6">
            <span className="text-4xl">💬</span>
            WhatsApp Campaign Manager
          </h1>
          <div className="flex gap-1 bg-gray-200 rounded-xl p-1 w-fit">
            {(["contacts", "campaign"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab === "contacts" ? "Contacts" : "Send Campaign"}
              </button>
            ))}
          </div>
        </div>

        {/* Alert */}
        {message && (
          <div className={`rounded-xl px-4 py-3 mb-6 text-sm font-medium ${alertStyles[messageType]}`}>
            {message}
          </div>
        )}

        {/* ── CONTACTS TAB ── */}
        {activeTab === "contacts" && (
          <>
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-700 mb-3">Add Contacts</h2>

              {addMethod === null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setAddMethod("manual")}
                    className="group bg-white border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50 rounded-2xl p-6 text-left transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center text-2xl mb-4 transition">✏️</div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Add Manually</h3>
                    <p className="text-sm text-gray-500">Enter a contact's name and phone number one at a time.</p>
                  </button>

                  <button
                    onClick={() => setAddMethod("csv")}
                    className="group bg-white border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl p-6 text-left transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center text-2xl mb-4 transition">📂</div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Upload CSV File</h3>
                    <p className="text-sm text-gray-500">Import multiple contacts at once from a .csv file.</p>
                  </button>
                </div>
              )}

              {addMethod === "manual" && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">✏️ Add Contact Manually</h3>
                    <button onClick={() => setAddMethod(null)} className="text-xs text-gray-400 hover:text-gray-700 transition">← Back</button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Name <span className="text-gray-400 font-normal normal-case">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 919999999999"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addManualContact()}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-5">
                    💡 Include country code — e.g.{" "}
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">919876543210</span> for India.
                  </p>
                  <button
                    onClick={addManualContact}
                    disabled={loading}
                    className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {loading ? "Adding..." : "Add Contact"}
                  </button>
                </div>
              )}

              {addMethod === "csv" && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">📂 Upload CSV File</h3>
                    <button
                      onClick={() => { setAddMethod(null); setCsvPreview([]); setCsvFileName(""); }}
                      className="text-xs text-gray-400 hover:text-gray-700 transition"
                    >← Back</button>
                  </div>
                  {!csvPreview.length && (
                    <>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-10 text-center cursor-pointer transition-all"
                      >
                        <div className="text-5xl mb-3">📁</div>
                        <p className="text-sm font-semibold text-gray-700">Click to choose a CSV file</p>
                        <p className="text-xs text-gray-400 mt-1">Format: columns named <span className="font-mono">name</span>, <span className="font-mono">phone</span></p>
                      </div>
                      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvFile} className="hidden" />
                      <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Expected CSV Format</p>
                        <pre className="text-xs font-mono text-gray-600 leading-relaxed">{`name,phone\nJohn Doe,919999999999\nJane Smith,918888888888`}</pre>
                      </div>
                    </>
                  )}
                  {csvPreview.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{csvFileName}</span>
                          <span className="ml-2 text-xs text-gray-400">{csvPreview.length} contacts found</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setCsvSelected(csvSelected.length === csvPreview.length ? [] : csvPreview.map((c) => c.id))}
                            className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition"
                          >
                            {csvSelected.length === csvPreview.length ? "Deselect All" : "Select All"}
                          </button>
                          <button
                            onClick={() => { setCsvPreview([]); setCsvFileName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="text-xs text-gray-400 hover:text-red-500 transition"
                          >Change file</button>
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="w-10 px-3 py-2.5 text-center">
                                  <input type="checkbox" checked={csvSelected.length === csvPreview.length} onChange={() => setCsvSelected(csvSelected.length === csvPreview.length ? [] : csvPreview.map((c) => c.id))} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                                </th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {csvPreview.map((c) => (
                                <tr key={c.id} className={`transition ${csvSelected.includes(c.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                                  <td className="px-3 py-2.5 text-center">
                                    <input type="checkbox" checked={csvSelected.includes(c.id)} onChange={() => toggleCsvSelect(c.id)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-800">{c.name || <span className="text-gray-400">—</span>}</td>
                                  <td className="px-3 py-2.5 font-mono text-gray-600 text-xs">{c.phone}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={saveCsvContacts}
                          disabled={loading || csvSelected.length === 0}
                          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition"
                        >
                          {loading ? "Importing..." : `Import ${csvSelected.length} Contact${csvSelected.length !== 1 ? "s" : ""}`}
                        </button>
                        <span className="text-xs text-gray-400">{csvSelected.length} of {csvPreview.length} selected</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Contacts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">All Contacts</span>
                  <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">{contacts.length}</span>
                  {selected.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{selected.length} selected</span>
                  )}
                </div>
                {contacts.length > 0 && (
                  <button onClick={toggleAll} className="text-xs text-green-600 font-semibold hover:text-green-800 transition">
                    {selected.length === contacts.length ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>
              {contacts.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-gray-400 text-sm">No contacts yet. Add some to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-12 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">✓</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {contacts.map((c) => (
                        <tr key={c.id} className={`transition ${selected.includes(c.id) ? "bg-green-50" : "hover:bg-gray-50"}`}>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4 accent-green-600 cursor-pointer" />
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{c.name || <span className="text-gray-400">—</span>}</td>
                          <td className="px-4 py-3 font-mono text-gray-600 text-xs">{c.phone}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => deleteContact(c.id)} className="text-xs text-red-400 hover:text-red-700 font-semibold transition">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CAMPAIGN TAB ── */}
        {activeTab === "campaign" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">🚀 Send Campaign</h2>
            <p className="text-sm text-gray-500 mb-6">
              Sending to <span className="font-semibold text-green-600">{selected.length}</span> contact{selected.length !== 1 ? "s" : ""}
            </p>
            {selected.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
                <span>⚠️</span>
                <span>Go to the <strong>Contacts</strong> tab and check the contacts you want to message.</span>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g., Diwali Sale 2024"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">WhatsApp Message</label>
              <textarea
                placeholder="Type your message here..."
                value={campaignMsg}
                onChange={(e) => setCampaignMsg(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none transition"
              />
              <p className="text-xs text-gray-400 mt-1">{campaignMsg.length} characters</p>
            </div>
            <button
              onClick={sendCampaign}
              disabled={loading || selected.length === 0}
              className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-40 transition"
            >
              {loading ? "Sending..." : `Send to ${selected.length} Contact${selected.length !== 1 ? "s" : ""} 🚀`}
            </button>
            {sendResults && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{sendResults.sent}</div>
                  <div className="text-xs text-emerald-600 font-medium mt-1 uppercase tracking-wider">✅ Sent</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{sendResults.failed}</div>
                  <div className="text-xs text-red-500 font-medium mt-1 uppercase tracking-wider">❌ Failed</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-700">{sendResults.total}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">Total</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}