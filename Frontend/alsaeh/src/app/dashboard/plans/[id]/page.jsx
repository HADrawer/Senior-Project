"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import { supabase } from "@/lib/supabase";

function getErrorMessage(detail, fallback) {
  if (Array.isArray(detail)) return detail[0]?.msg || fallback;
  if (typeof detail === "string") return detail;
  return fallback;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export default function PlanDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({
    title: "",
    days: "",
    budget: "",
    people_count: "",
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

  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    async function initPage() {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      await loadPlan(token);
    }

    initPage();
  }, [id, router]);

  async function loadPlan(tokenFromInit = null) {
    try {
      const token = tokenFromInit || (await getAccessToken());

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        router.replace("/dashboard");
        return;
      }

      const data = await res.json();
      setPlan(data);
      fillForm(data);
    } catch (error) {
      console.error("Load plan error:", error);
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  function fillForm(data) {
    setForm({
      title: data.title || "",
      days: data.days || "",
      budget: data.budget ?? "",
      people_count: data.people_count || 1,
      preferences: data.preferences || "",
      user_interests: data.user_interests || "",
      travel_styles: data.travel_styles || "",
      category: data.category || "",
      place: data.place || "",
    });
  }

  async function refreshPlan() {
    const token = await getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const updatedPlan = await res.json();
      setPlan(updatedPlan);
      fillForm(updatedPlan);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          days: Number(form.days),
          budget: form.budget === "" ? null : Number(form.budget),
          people_count: Number(form.people_count),
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
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(data.detail, "Failed to delete plan"));
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error("Delete plan error:", error);
      setError("Unable to connect to server");
    } finally {
      setDeleting(false);
    }
  }

  async function handleChatSubmit(e) {
    e.preventDefault();

    if (!chatMessage.trim()) return;

    const userText = chatMessage.trim();

    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatMessage("");
    setChatLoading(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/plan-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: Number(id),
          message: userText,
          language: "auto",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text:
              typeof data.detail === "string"
                ? data.detail
                : "AI service is busy. Please try again.",
          },
        ]);
        return;
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "assistant", text: data.message || "Done." },
      ]);

      if (data.updated) {
        await refreshPlan();
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "assistant", text: "Unable to connect to server" },
      ]);
    } finally {
      setChatLoading(false);
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
            View, edit, and improve your tourism plan with the AI assistant.
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

      <div className={styles.planDetailsLayout}>
        <div className={styles.planDetailsMain}>
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
                    min="1"
                    className={styles.input}
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: e.target.value })}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Budget</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>People Count</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    value={form.people_count}
                    onChange={(e) =>
                      setForm({ ...form, people_count: e.target.value })
                    }
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
                  onClick={() => {
                    fillForm(plan);
                    setEditMode(false);
                  }}
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
                    <span className={styles.detailLabel}>People</span>
                    <strong>{plan.people_count || 1}</strong>
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

                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>People</span>
                      <strong>{plan.people_count || 1}</strong>
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

                                {activity.location_area && (
                                  <p className={styles.locationText}>
                                    {activity.location_name || activity.name} ·{" "}
                                    {activity.location_area}
                                  </p>
                                )}

                                {activity.google_maps_url && (
                                  <a
                                    href={activity.google_maps_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.mapButton}
                                  >
                                    Open in Google Maps
                                  </a>
                                )}
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

        <aside className={styles.aiChatPanel}>
          <div className={styles.aiChatHeader}>
            <h3>AI Trip Assistant</h3>
            <p>Ask for advice or request changes to this plan.</p>
          </div>

          <div className={styles.aiChatMessages}>
            {chatMessages.length === 0 ? (
              <div className={styles.aiChatEmpty}>
                Ask me about this trip, or tell me what you want to change.
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={
                    msg.sender === "user"
                      ? styles.userChatBubble
                      : styles.assistantChatBubble
                  }
                >
                  {msg.text}
                </div>
              ))
            )}

            {chatLoading && (
              <div className={styles.assistantChatBubble}>Thinking...</div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className={styles.aiChatForm}>
            <textarea
              value={chatMessage}
              placeholder="Ask for advice or request a change..."
              onChange={(e) => setChatMessage(e.target.value)}
              disabled={chatLoading}
            />

            <button type="submit" disabled={chatLoading || !chatMessage.trim()}>
              Send
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}