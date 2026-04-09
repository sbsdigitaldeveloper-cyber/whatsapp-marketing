"use client";

export function FailedContacts({ data, isLoading }: any) {
  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading contacts...</div>;
  }

  if (!data.length) {
    return <div className="text-sm text-gray-400">No failed contacts 🎉</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h2 className="text-sm font-semibold mb-3">Failed Contacts</h2>

      <div className="space-y-2 max-h-[320px] overflow-auto">
        {data.map((c: any, i: number) => (
          <div
            key={i}
            className="flex justify-between items-center border-b pb-2 text-xs"
          >
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-gray-400">{c.phone}</div>
            </div>

            <div className="text-red-500 font-semibold">
              {c.failures} fails
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}