"use client";

import { useEffect, useState } from "react";

export default function WhatsAppPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch("/api/admin/all-users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  const submit = async () => {
    await fetch("/api/admin/setup-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    alert("Saved");
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">WhatsApp Config</h1>

      <div className="space-y-3 max-w-md">
        <select
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          className="w-full border p-2"
        >
          <option>Select User</option>
          {users.map((u: any) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <input placeholder="Phone Number ID"
          onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
          className="w-full border p-2"
        />

        <input placeholder="Access Token"
          onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
          className="w-full border p-2"
        />

        <button onClick={submit} className="bg-green-500 text-white p-2 rounded">
          Save Config
        </button>
      </div>
    </div>
  );
}