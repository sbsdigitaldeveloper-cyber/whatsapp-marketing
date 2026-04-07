// "use client";

// import { useRouter } from "next/navigation";

// export function useLogout() {
//   const router = useRouter();

//   return async function logout() {
//     // 1. Call logout API to delete the auth_user cookie
//     await fetch("/api/logout", { method: "POST" });

//     // 2. Clear all localStorage
//     localStorage.removeItem("token");
//     localStorage.removeItem("user_name");
//     localStorage.removeItem("user_id");
//     localStorage.removeItem("email");

//     // 3. Force hard redirect to login (not soft navigation)
//     window.location.href = "/login";
//   };
// }


"use client";

export function useLogout() {
  return async function logout() {
    // ✅ Correct API URL + credentials include
    await fetch("/api/authentication/logout", {
      method: "POST",
      credentials: "include", // ✅ cookie clear hone ke liye zaroori
    });

    // ✅ Clear localStorage
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    localStorage.removeItem("email");
    // ❌ token remove karne ki zaroorat nahi — wo localStorage mein hai hi nahi ab

    // ✅ Hard redirect — sab cached state clear
    window.location.href = "/login";
  };
}