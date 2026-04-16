"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats);

    fetch("/api/admin/all-users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  const action = async (type: string, userId: number) => {
    await fetch(`/api/admin/${type}`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });

    // refresh users
    const res = await fetch("/api/admin/all-users");
    const data = await res.json();
    setUsers(data);
  };

  if (!stats) return <p>Loading...</p>;

  const activeUsers = users.filter((u) => u.status === "ACTIVE");
  const pendingUsers = users.filter((u) => u.status === "PENDING");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="flex justify-between items-center mt-8 mb-3">
  <h2 className="text-lg font-semibold">Recent Users</h2>

  <Link href="/super-admin/users">
    <button className="text-green-600 text-sm font-medium">
      View All →
    </button>
  </Link>
</div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card title="Total Users" value={stats.totalUsers} />
        <Card title="Active Users" value={stats.activeUsers} />
        <Card title="Pending Users" value={stats.pendingUsers} />
        <Card title="Messages" value={stats.totalMessages} />
      </div>

      {/* ACTIVE USERS */}
      <UserTable
        title="Active Users"
        users={activeUsers}
        action={action}
      />

      {/* PENDING USERS */}
      <UserTable
        title="Pending Users"
        users={pendingUsers}
        action={action}
      />
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}

function UserTable({ title, users, action }: any) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>

      <table className="w-full bg-white rounded shadow">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">Name</th>
            <th>Email</th>
            <th>Org</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u: any) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.orgName || "-"}</td>
              <td>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    u.status === "ACTIVE"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {u.status}
                </span>
              </td>

              <td className="flex gap-2">
                {u.status === "PENDING" && (
                  <button
                    onClick={() => action("approve-user", u.id)}
                    className="text-green-600"
                  >
                    Approve
                  </button>
                )}

                {u.status === "ACTIVE" && (
                  <button
                    onClick={() => action("suspend-user", u.id)}
                    className="text-red-600"
                  >
                    Suspend
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}