"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";

function getErrorMessage(detail, fallback) {
  if (Array.isArray(detail)) {
    return detail[0]?.msg || fallback;
  }

  if (typeof detail === "string") {
    return detail;
  }

  return fallback;
}

export default function PlanDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({
    title: "",
    days: "",
    budget: "",
    preferences: "",
    user_interests: "",
    travel_styles: "",
    category: "",
    place: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          router.replace("/dashboard");
          return;
        }

        const data = await res.json();

        setPlan(data);
        setForm({
          title: data.title || "",
          days: data.days || "",
          budget: data.budget ?? "",
          preferences: data.preferences || "",
          user_interests: data.user_interests || "",
          travel_styles: data.travel_styles || "",
          category: data.category || "",
          place: data.place || "",
        });
      } catch (error) {
        console.error("Load plan error:", error);
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [id, router]);

  async function refreshPlan() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${id}`, {
      credentials: "include",
    });

    if (res.ok) {
      const updatedPlan = await res.json();
      setPlan(updatedPlan);
      setForm({
        title: updatedPlan.title || "",
        days: updatedPlan.days || "",
        budget: updatedPlan.budget ?? "",
        preferences: updatedPlan.preferences || "",
        user_interests: updatedPlan.user_interests || "",
        travel_styles: updatedPlan.travel_styles || "",
        category: updatedPlan.category || "",
        place: updatedPlan.place || "",
      });
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          days: Number(form.days),
          budget: form.budget === "" ? null : Number(form.budget),
          preferences: form.preferences || null,
          user_interests: form.user_interests || null,
          travel_styles: form.travel_styles || null,
          category: form.category || null,
          place: form.place || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(data.detail, "Failed to update plan"));
        return;
      }

      await refreshPlan();
      setEditMode(false);
    } catch (error) {
      console.error("Update plan error:", error);
      setError("Unable to connect to server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this plan?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(data.detail, "Failed to delete plan"));
        setDeleting(false);
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error("Delete plan error:", error);
      setError("Unable to connect to server");
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className={styles.emptyState}>Loading...</div>;
  }

  if (!plan) {
    return <div className={styles.emptyState}>Plan not found</div>;
  }

  const aiPlan = plan.plan_details_json || null;

  return (
    <div className={styles.pageContent}>
      <div className={styles.detailsHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            {plan.title || aiPlan?.title || "Untitled Plan"}
          </h1>
          <p className={styles.pageSubtitle}>
            View and manage your tourism plan details.
          </p>
        </div>

        <div className={styles.detailsActions}>
          {!editMode && (
            <button
              className={styles.secondaryActionButton}
              onClick={() => setEditMode(true)}
            >
              Edit Plan
            </button>
          )}

          <button
            className={styles.deleteButton}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Plan"}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {editMode ? (
        <form onSubmit={handleUpdate} className={styles.detailsCard}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Title</label>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Days</label>
              <input
                type="number"
                className={styles.input}
                value={form.days}
                onChange={(e) => setForm({ ...form, days: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Budget</label>
              <input
                type="number"
                className={styles.input}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Category</label>
              <input
                className={styles.input}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Place</label>
              <input
                className={styles.input}
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Travel Style</label>
              <input
                className={styles.input}
                value={form.travel_styles}
                onChange={(e) =>
                  setForm({ ...form, travel_styles: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Preferences</label>
            <textarea
              className={styles.textarea}
              value={form.preferences}
              onChange={(e) =>
                setForm({ ...form, preferences: e.target.value })
              }
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>User Interests</label>
            <textarea
              className={styles.textarea}
              value={form.user_interests}
              onChange={(e) =>
                setForm({ ...form, user_interests: e.target.value })
              }
            />
          </div>

          <div className={styles.detailsActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setEditMode(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className={styles.detailsCard}>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Days</span>
                <strong>{plan.days}</strong>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Budget</span>
                <strong>{plan.budget ?? 0} BHD</strong>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <strong>{plan.status}</strong>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Generated by AI</span>
                <strong>{plan.generated_by_ai ? "Yes" : "No"}</strong>
              </div>
            </div>

            <div className={styles.detailBlock}>
              <h3 className={styles.blockTitle}>Preferences</h3>
              <p>{plan.preferences || "-"}</p>
            </div>

            <div className={styles.detailBlock}>
              <h3 className={styles.blockTitle}>User Interests</h3>
              <p>{plan.user_interests || "-"}</p>
            </div>
          </div>

          {aiPlan && (
            <div className={styles.detailsCard} style={{ marginTop: "22px" }}>
              <h2 className={styles.blockTitle}>
                {aiPlan.title || "AI Generated Itinerary"}
              </h2>

              <p className={styles.pageSubtitle}>
                {aiPlan.summary || "No summary available."}
              </p>

              <div className={styles.detailsGrid} style={{ marginTop: "20px" }}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Estimated Budget</span>
                  <strong>
                    {aiPlan.estimated_total_budget_bhd ?? plan.budget ?? 0} BHD
                  </strong>
                </div>
              </div>

              {Array.isArray(aiPlan.days) &&
                aiPlan.days.map((day) => (
                  <div key={day.day_number} className={styles.detailBlock}>
                    <h3 className={styles.blockTitle}>
                      Day {day.day_number}: {day.theme}
                    </h3>

                    {Array.isArray(day.activities) &&
                    day.activities.length > 0 ? (
                      <div className={styles.planGrid}>
                        {day.activities.map((activity, index) => (
                          <div key={index} className={styles.planCard}>
                            <div className={styles.planTop}>
                              <h4 className={styles.planTitle}>
                                {activity.name}
                              </h4>
                              <span className={styles.planStatus}>
                                {activity.type}
                              </span>
                            </div>

                            <p className={styles.planDescription}>
                              {activity.notes}
                            </p>

                            <div className={styles.planMeta}>
                              <span>{activity.time}</span>
                              <span>
                                {activity.estimated_cost_bhd ?? 0} BHD
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No activities for this day.</p>
                    )}
                  </div>
                ))}

              {Array.isArray(aiPlan.tips) && aiPlan.tips.length > 0 && (
                <div className={styles.detailBlock}>
                  <h3 className={styles.blockTitle}>Tips</h3>
                  <ul>
                    {aiPlan.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}