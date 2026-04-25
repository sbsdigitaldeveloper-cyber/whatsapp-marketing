"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Sirf outer container aur centering handle karo yahan
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] relative overflow-x-hidden">
      
      {/* Background Decorative Glows (SaaS Feel) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-50/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/60 rounded-full blur-[120px]" />
      </div>

      {/* Children (Register/Login Page) yahan render hoga */}
      {/* Humne yahan se white box aur padding hata di hai */}
      <div className="w-full flex items-center justify-center p-6 py-12">
        {children}
      </div>
    </div>
  );
}