"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

function getErrorMessage(detail, fallback) {
  if (Array.isArray(detail)) return detail[0]?.msg || fallback;
  if (typeof detail === "string") return detail;
  return fallback;
}

export default function AdminPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState("");



  useEffect(() => {
    async function initAdmin() {
      try {
        const authRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            credentials: "include",
          }
        );

        if (!authRes.ok) {
          router.replace("/login");
          return;
        }

        const user = await authRes.json();

        // Prevent logged in users from accessing admin page
        if (!user || user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        await loadOverview();
      } catch (error) {
        console.error(error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    initAdmin();
  }, [router]);



  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  async function loadOverview() {
    setSectionLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/overview`, {
        credentials: "include",
      });

      const result = await safeJson(res);

      if (!res.ok) {
        setError(getErrorMessage(result.detail, "Failed to load overview"));
        return;
      }

      setOverview(result);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    } finally {
      setSectionLoading(false);
    }
  }

  async function loadUsers() {
    setSectionLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        credentials: "include",
      });

      const result = await safeJson(res);

      if (!res.ok) {
        setError(getErrorMessage(result.detail, "Failed to load users"));
        return;
      }

      setUsers(result);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    } finally {
      setSectionLoading(false);
    }
  }

  async function loadPlans() {
    setSectionLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans`, {
        credentials: "include",
      });

      const result = await safeJson(res);

      if (!res.ok) {
        setError(getErrorMessage(result.detail, "Failed to load plans"));
        return;
      }

      setPlans(result);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    } finally {
      setSectionLoading(false);
    }
  }

  async function loadLogs() {
    setSectionLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/logs`, {
        credentials: "include",
      });

      const result = await safeJson(res);

      if (!res.ok) {
        setError(getErrorMessage(result.detail, "Failed to load logs"));
        return;
      }

      setLogs(result);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    } finally {
      setSectionLoading(false);
    }
  }

  async function changeTab(tab) {
    setActiveTab(tab);

    if (tab === "overview") await loadOverview();
    if (tab === "users") await loadUsers();
    if (tab === "plans") await loadPlans();
    if (tab === "logs") await loadLogs();
  }

  async function updateUser(userId, payload) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        alert(getErrorMessage(result.detail, "Failed to update user"));
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  }

  async function disableUser(userId) {
    const confirmed = window.confirm("Are you sure you want to disable this user?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await safeJson(res);

      if (!res.ok) {
        alert(getErrorMessage(result.detail, "Failed to disable user"));
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  }

  async function updatePlan(planId, payload) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        alert(getErrorMessage(result.detail, "Failed to update plan"));
        return;
      }

      await loadPlans();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  }

  async function deletePlan(planId) {
    const confirmed = window.confirm("Are you sure you want to delete this plan?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await safeJson(res);

      if (!res.ok) {
        alert(getErrorMessage(result.detail, "Failed to delete plan"));
        return;
      }

      await loadPlans();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  }

  if (loading) {
    return <main className={styles.page}>Loading...</main>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <span className={styles.badge}>Admin Panel</span>
        <h1>System Management</h1>
        <p>Manage users, plans, logs, and monitor system activity.</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={activeTab === "overview" ? styles.activeTab : ""}
          onClick={() => changeTab("overview")}
        >
          Overview
        </button>

        <button
          className={activeTab === "users" ? styles.activeTab : ""}
          onClick={() => changeTab("users")}
        >
          Users
        </button>

        <button
          className={activeTab === "plans" ? styles.activeTab : ""}
          onClick={() => changeTab("plans")}
        >
          Plans
        </button>

        <button
          className={activeTab === "logs" ? styles.activeTab : ""}
          onClick={() => changeTab("logs")}
        >
          Logs
        </button>
      </div>

      {error && (
        <div className={styles.errorCard}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}

      {sectionLoading && <p className={styles.loadingText}>Loading data...</p>}

      {!sectionLoading && activeTab === "overview" && (
        <OverviewSection data={overview} />
      )}

      {!sectionLoading && activeTab === "users" && (
        <UsersSection
          users={users}
          onUpdateUser={updateUser}
          onDisableUser={disableUser}
        />
      )}

      {!sectionLoading && activeTab === "plans" && (
        <PlansSection
          plans={plans}
          onUpdatePlan={updatePlan}
          onDeletePlan={deletePlan}
        />
      )}

      {!sectionLoading && activeTab === "logs" && (
        <LogsSection logs={logs} />
      )}
    </main>
  );
}

function OverviewSection({ data }) {
  if (!data) {
    return (
      <section className={styles.panel}>
        <p className={styles.empty}>No overview data available.</p>
      </section>
    );
  }

  return (
    <>
      <section className={styles.statsGrid}>
        <StatCard title="Total Users" value={data.total_users} />
        <StatCard title="Total Plans" value={data.total_plans} />
        <StatCard title="AI Generated Plans" value={data.ai_plans} />
        <StatCard title="Chat Messages" value={data.total_messages} />
        <StatCard title="Usage Logs" value={data.total_logs} />
      </section>

      <section className={styles.panel}>
        <h2>Popular Categories</h2>

        {!data.popular_categories || data.popular_categories.length === 0 ? (
          <p className={styles.empty}>No category data yet.</p>
        ) : (
          <div className={styles.categoryList}>
            {data.popular_categories.map((item, index) => (
              <div key={index} className={styles.categoryItem}>
                <span>{item.category || "Unknown"}</span>
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function UsersSection({ users, onUpdateUser, onDisableUser }) {
  if (!users.length) {
    return (
      <section className={styles.panel}>
        <h2>Users</h2>
        <p className={styles.empty}>No users found.</p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <h2>Users</h2>

      <div className={styles.tableWrap}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Language</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onUpdateUser={onUpdateUser}
                onDisableUser={onDisableUser}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UserRow({ user, onUpdateUser, onDisableUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    phone_number: user.phone_number || "",
    preferred_language: user.preferred_language || "en",
    is_active: user.is_active,
  });

  return (
    <tr>
      <td>
        {editing ? (
          <input
            className={styles.inlineInput}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        ) : (
          user.full_name
        )}
      </td>

      <td>{user.email}</td>

      <td>
        {editing ? (
          <input
            className={styles.inlineInput}
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          />
        ) : (
          user.phone_number || "-"
        )}
      </td>

      <td>{user.role}</td>

      <td>
        {editing ? (
          <select
            className={styles.inlineInput}
            value={form.preferred_language}
            onChange={(e) =>
              setForm({ ...form, preferred_language: e.target.value })
            }
          >
            <option value="en">en</option>
            <option value="ar">ar</option>
          </select>
        ) : (
          user.preferred_language
        )}
      </td>

      <td>
        {editing ? (
          <select
            className={styles.inlineInput}
            value={String(form.is_active)}
            onChange={(e) =>
              setForm({ ...form, is_active: e.target.value === "true" })
            }
          >
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
        ) : user.is_active ? (
          "Active"
        ) : (
          "Disabled"
        )}
      </td>

      <td>
        <div className={styles.rowActions}>
          {editing ? (
            <>
              <button
                className={styles.smallPrimary}
                onClick={() => {
                  onUpdateUser(user.id, form);
                  setEditing(false);
                }}
              >
                Save
              </button>

              <button
                className={styles.smallSecondary}
                onClick={() => {
                  setForm({
                    full_name: user.full_name || "",
                    phone_number: user.phone_number || "",
                    preferred_language: user.preferred_language || "en",
                    is_active: user.is_active,
                  });
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.smallSecondary}
                onClick={() => setEditing(true)}
              >
                Edit
              </button>

              <button
                className={styles.smallDanger}
                onClick={() => onDisableUser(user.id)}
              >
                Disable
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function PlansSection({ plans, onUpdatePlan, onDeletePlan }) {
  if (!plans.length) {
    return (
      <section className={styles.panel}>
        <h2>Plans</h2>
        <p className={styles.empty}>No plans found.</p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <h2>Plans</h2>

      <div className={styles.tableWrap}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Days</th>
              <th>Budget</th>
              <th>People</th>
              <th>Status</th>
              <th>AI</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                onUpdatePlan={onUpdatePlan}
                onDeletePlan={onDeletePlan}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlanRow({ plan, onUpdatePlan, onDeletePlan }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: plan.title || "",
    days: plan.days || 1,
    budget: plan.budget ?? "",
    people_count: plan.people_count || 1,
    status: plan.status || "saved",
  });

  return (
    <tr>
      <td>
        {editing ? (
          <input
            className={styles.inlineInput}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        ) : (
          plan.title || "Untitled"
        )}
      </td>

      <td>
        <strong>{plan.user_name || "Unknown"}</strong>
        <br />
        <small>{plan.user_email || "-"}</small>
      </td>

      <td>
        {editing ? (
          <input
            type="number"
            min="1"
            className={styles.inlineInput}
            value={form.days}
            onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
          />
        ) : (
          plan.days
        )}
      </td>

      <td>
        {editing ? (
          <input
            type="number"
            min="0"
            className={styles.inlineInput}
            value={form.budget}
            onChange={(e) =>
              setForm({
                ...form,
                budget: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        ) : (
          `${plan.budget ?? 0} BHD`
        )}
      </td>

      <td>
        {editing ? (
          <input
            type="number"
            min="1"
            className={styles.inlineInput}
            value={form.people_count}
            onChange={(e) =>
              setForm({ ...form, people_count: Number(e.target.value) })
            }
          />
        ) : (
          plan.people_count || 1
        )}
      </td>

      <td>
        {editing ? (
          <select
            className={styles.inlineInput}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="draft">draft</option>
            <option value="saved">saved</option>
            <option value="deleted">deleted</option>
          </select>
        ) : (
          plan.status
        )}
      </td>

      <td>{plan.generated_by_ai ? "Yes" : "No"}</td>

      <td>
        <div className={styles.rowActions}>
          {editing ? (
            <>
              <button
                className={styles.smallPrimary}
                onClick={() => {
                  onUpdatePlan(plan.id, {
                    title: form.title,
                    days: form.days,
                    budget: form.budget === "" ? null : form.budget,
                    people_count: form.people_count,
                    status: form.status,
                  });
                  setEditing(false);
                }}
              >
                Save
              </button>

              <button
                className={styles.smallSecondary}
                onClick={() => {
                  setForm({
                    title: plan.title || "",
                    days: plan.days || 1,
                    budget: plan.budget ?? "",
                    people_count: plan.people_count || 1,
                    status: plan.status || "saved",
                  });
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.smallSecondary}
                onClick={() => setEditing(true)}
              >
                Edit
              </button>

              <button
                className={styles.smallDanger}
                onClick={() => onDeletePlan(plan.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function LogsSection({ logs }) {
  if (!logs.length) {
    return (
      <section className={styles.panel}>
        <h2>Logs</h2>
        <p className={styles.empty}>No logs found.</p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <h2>Usage Logs</h2>

      <div className={styles.tableWrap}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Entity</th>
              <th>Metadata</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.action_type}</td>

                <td>
                  <strong>{log.user_name || "Unknown"}</strong>
                  <br />
                  <small>{log.user_email || "-"}</small>
                </td>

                <td>
                  {log.entity_type || "-"} #{log.entity_id || "-"}
                </td>

                <td>
                  <pre className={styles.metadataBox}>
                    {JSON.stringify(log.metadata_json || {}, null, 2)}
                  </pre>
                </td>

                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatCard({ title, value }) {
  return (
    <div className={styles.statCard}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}