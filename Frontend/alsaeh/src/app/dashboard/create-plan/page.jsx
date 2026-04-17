"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";

export default function CreatePlanPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    days: "",
    budget: "",
    preferences: "",
    user_interests: "",
    travel_styles: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          days: Number(form.days),
          budget: form.budget ? Number(form.budget) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to create plan");
        setLoading(false);
        return;
      }

      // يرجع للداشبورد بعد الإنشاء
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Server error");
    }

    setLoading(false);
  }

  return (
    <div className={styles.pageContent}>
      <h1 className={styles.pageTitle}>Create Plan</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={styles.input}
        />

        <input
          placeholder="Days"
          value={form.days}
          onChange={(e) => setForm({ ...form, days: e.target.value })}
          className={styles.input}
        />

        <input
          placeholder="Budget"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
          className={styles.input}
        />

        <input
          placeholder="Preferences"
          value={form.preferences}
          onChange={(e) =>
            setForm({ ...form, preferences: e.target.value })
          }
          className={styles.input}
        />

        <input
          placeholder="Interests"
          value={form.user_interests}
          onChange={(e) =>
            setForm({ ...form, user_interests: e.target.value })
          }
          className={styles.input}
        />

        <input
          placeholder="Travel Style"
          value={form.travel_styles}
          onChange={(e) =>
            setForm({ ...form, travel_styles: e.target.value })
          }
          className={styles.input}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.primaryButton} disabled={loading}>
          {loading ? "Creating..." : "Create Plan"}
        </button>
      </form>
    </div>
  );
}