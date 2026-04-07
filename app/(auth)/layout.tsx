"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        {/* Logo */}
        <h1 className="text-3xl font-bold text-green-600 text-center mb-6">
          SBS ChatTech
        </h1>
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}


