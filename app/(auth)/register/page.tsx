// "use client";

// import { useState } from "react";
// import Link from "next/link";

// export default function RegisterPage() {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [message, setMessage] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const res = await fetch("/api/authentication/register", {
//       method: "POST",
//       body: JSON.stringify({ name, email, password }),
//       headers: { "Content-Type": "application/json" },
//     });

//     const data = await res.json();
//     setMessage(data.error || data.message);
//   };

//   return (
//     <div className="max-w-md mx-auto mt-20">
//       <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>

//       <form className="space-y-4" onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Full Name"
//           className="w-full border px-4 py-2 rounded-lg"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//         />
//         <input
//           type="email"
//           placeholder="Email"
//           className="w-full border px-4 py-2 rounded-lg"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full border px-4 py-2 rounded-lg"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//         <button className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold">
//           Register
//         </button>
//       </form>

//       {message && <p className="mt-4 text-center text-red-500">{message}</p>}

//       <p className="mt-4 text-center text-gray-600">
//         Already have an account?{" "}
//         <Link href="/login" className="text-green-500 font-semibold">
//           Login
//         </Link>
//       </p>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Building2, Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orgName: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/authentication/register", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push("/login?msg=Registered successfully. Please login.");
    } else {
      setMessage(data.error || "Registration failed");
    }
  };

  return (

    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-6 py-12 md:py-20 relative overflow-x-hidden">
      
      {/* ── Background Glow ── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-50/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/60 rounded-full blur-[120px]" />
      </div>

      {/* Main Wrapper: Controls the maximum width of the central block */}
      <div className="max-w-[460px] w-full flex flex-col gap-8">
        
        {/* Brand/Logo Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-all duration-500">
             <ShieldCheck className="text-green-400" size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">SBS whatsapp Marketing Platform</h1>
            <div className="h-1 w-8 bg-green-500 mx-auto rounded-full mt-1" />
          </div>
        </div>

        {/* ── Modern SaaS Card ── */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-100 p-8 md:p-12">
          
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Create Account</h2>
            <p className="text-sm text-gray-400 mt-3 font-medium">Simplify your team communications in minutes.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Input Group */}
              {[
                { label: "Full Name", icon: User, type: "text", key: "name", placeholder: "John Doe" },
                { label: "Organization", icon: Building2, type: "text", key: "orgName", placeholder: "Acme Inc." },
                { label: "Email Address", icon: Mail, type: "email", key: "email", placeholder: "john@example.com" },
                { label: "Password", icon: Lock, type: "password", key: "password", placeholder: "••••••••" }
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                  <div className="relative group">
                    <field.icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" />
                    <input
                      type={field.type}
                      required
                      className="w-full bg-gray-50/50 border border-gray-200 px-11 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/5 focus:border-green-500 outline-none transition-all text-sm placeholder:text-gray-300"
                      placeholder={field.placeholder}
                      onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold mt-6 shadow-xl shadow-green-200/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Get Started for Free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {message && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-red-500">{message}</p>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Existing user?{" "}
              <Link href="/login" className="text-green-600 font-bold hover:text-green-700 transition-colors">
                Sign in to workspace
              </Link>
            </p>
          </div>
        </div>

       
       
      </div>
    </div>
  );
}