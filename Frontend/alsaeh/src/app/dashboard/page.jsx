"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setUser(data);
    }

    loadUser();
  }, [router]);

  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    router.push("/login");
  }

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h1>Welcome {user.full_name}</h1>
      <p>{user.email}</p>
      <p>{user.role}</p>

      <button onClick={logout}>Logout</button>
    </div>
  );
}