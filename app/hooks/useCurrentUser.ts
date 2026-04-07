"use client";

import { useEffect, useState } from "react";

type User = { name: string; email: string } | null;

export function useCurrentUser() {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const name = localStorage.getItem("user_name");
    const email = localStorage.getItem("email") ?? "";
    if (name) setUser({ name, email });
  }, []);

  return user;
}