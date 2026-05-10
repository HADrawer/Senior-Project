"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";
import dashboardStyles from "../dashboard/dashboard.module.css";
import { supabase } from "@/lib/supabase";

async function getAdminToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function getErrorMessage(detail, fallback) {
  if (Array.isArray(detail)) return detail[0]?.msg || fallback;
  if (typeof detail === "string") return detail;
  return fallback;
}

const ADMIN_CACHE_TTL_MS = 2 * 60 * 1000;
const ADMIN_CACHE_KEYS = {
  overview: "admin_overview",
  users: "admin_users",
  plans: "admin_plans",
  logs: "admin_logs",
};

function readAdminCache(key) {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

function writeAdminCache(key, data) {
  sessionStorage.setItem(
    key,
    JSON.stringify({
      data,
      savedAt: Date.now(),
    })
  );
}

function isFreshCache(cache) {
  return cache && Date.now() - cache.savedAt < ADMIN_CACHE_TTL_MS;
}

export default function AdminPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("en");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState("");

  const content = {
    en: {
      brand: "Alsaeh.bh",
      adminRole: "Admin",
      dashboard: "Dashboard",
      createPlan: "Create Plan",
      settings: "Settings",
      about: "About",
      admin: "Admin",
      logout: "Logout",
      langButton: "Arabic",
      loading: "Loading...",
      loadingData: "Loading data...",
      adminPanel: "Admin Panel",
      title: "System Management",
      subtitle: "Manage users, plans, logs, and monitor system activity.",
      overview: "Overview",
      users: "Users",
      plans: "Plans",
      logs: "Logs",
      error: "Error",
      noOverview: "No overview data available.",
      totalUsers: "Total Users",
      totalPlans: "Total Plans",
      aiGeneratedPlans: "AI Generated Plans",
      chatMessages: "Chat Messages",
      usageLogs: "Usage Logs",
      popularCategories: "Popular Categories",
      noCategoryData: "No category data yet.",
      unknown: "Unknown",
      noUsers: "No users found.",
      name: "Name",
      email: "Email",
      phone: "Phone",
      role: "Role",
      language: "Language",
      status: "Status",
      actions: "Actions",
      active: "Active",
      disabled: "Disabled",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      disable: "Disable",
      enable: "Enable",
      noPlans: "No plans found.",
      planTitle: "Title",
      user: "User",
      days: "Days",
      budget: "Budget",
      people: "People",
      delete: "Delete",
      untitled: "Untitled",
      yes: "Yes",
      no: "No",
      noLogs: "No logs found.",
      action: "Action",
      entity: "Entity",
      metadata: "Metadata",
      date: "Date",
      confirmDisable: "Are you sure you want to disable this user?",
      confirmEnable: "Are you sure you want to enable this user?",
      confirmDeleteUser:
        "Are you sure you want to permanently delete this user and all related data?",
      confirmDeletePlan: "Are you sure you want to delete this plan?",
      unableToConnect: "Unable to connect to server",
      failedOverview: "Failed to load overview",
      failedUsers: "Failed to load users",
      failedPlans: "Failed to load plans",
      failedLogs: "Failed to load logs",
      failedUpdateUser: "Failed to update user",
      failedDisableUser: "Failed to disable user",
      failedEnableUser: "Failed to enable user",
      failedDeleteUser: "Failed to delete user",
      failedUpdatePlan: "Failed to update plan",
      failedDeletePlan: "Failed to delete plan",
    },
    ar: {
      brand: "Alsaeh.bh",
      adminRole: "مشرف",
      dashboard: "لوحة التحكم",
      createPlan: "إنشاء خطة",
      settings: "الإعدادات",
      about: "About",
      admin: "الإدارة",
      logout: "تسجيل الخروج",
      langButton: "English",
      loading: "جاري التحميل...",
      loadingData: "جاري تحميل البيانات...",
      adminPanel: "لوحة الإدارة",
      title: "إدارة النظام",
      subtitle: "إدارة المستخدمين والخطط والسجلات ومراقبة نشاط النظام.",
      overview: "نظرة عامة",
      users: "المستخدمون",
      plans: "الخطط",
      logs: "السجلات",
      error: "خطأ",
      noOverview: "لا توجد بيانات عامة متاحة.",
      totalUsers: "إجمالي المستخدمين",
      totalPlans: "إجمالي الخطط",
      aiGeneratedPlans: "خطط مولدة بالذكاء الاصطناعي",
      chatMessages: "رسائل المحادثة",
      usageLogs: "سجلات الاستخدام",
      popularCategories: "الفئات الشائعة",
      noCategoryData: "لا توجد بيانات فئات بعد.",
      unknown: "غير معروف",
      noUsers: "لا يوجد مستخدمون.",
      name: "الاسم",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      role: "الدور",
      language: "اللغة",
      status: "الحالة",
      actions: "الإجراءات",
      active: "نشط",
      disabled: "معطل",
      save: "حفظ",
      cancel: "إلغاء",
      edit: "تعديل",
      disable: "تعطيل",
      enable: "تفعيل",
      noPlans: "لا توجد خطط.",
      planTitle: "العنوان",
      user: "المستخدم",
      days: "الأيام",
      budget: "الميزانية",
      people: "الأشخاص",
      delete: "حذف",
      untitled: "بدون عنوان",
      yes: "نعم",
      no: "لا",
      noLogs: "لا توجد سجلات.",
      action: "الإجراء",
      entity: "الكيان",
      metadata: "البيانات",
      date: "التاريخ",
      confirmDisable: "هل أنت متأكد من تعطيل هذا المستخدم؟",
      confirmEnable: "هل أنت متأكد من تفعيل هذا المستخدم؟",
      confirmDeleteUser:
        "هل أنت متأكد من حذف هذا المستخدم وكل بياناته نهائيا؟",
      confirmDeletePlan: "هل أنت متأكد من حذف هذه الخطة؟",
      unableToConnect: "تعذر الاتصال بالخادم",
      failedOverview: "فشل تحميل النظرة العامة",
      failedUsers: "فشل تحميل المستخدمين",
      failedPlans: "فشل تحميل الخطط",
      failedLogs: "فشل تحميل السجلات",
      failedUpdateUser: "فشل تحديث المستخدم",
      failedDisableUser: "فشل تعطيل المستخدم",
      failedEnableUser: "فشل تفعيل المستخدم",
      failedDeleteUser: "فشل حذف المستخدم",
      failedUpdatePlan: "فشل تحديث الخطة",
      failedDeletePlan: "فشل حذف الخطة",
    },
  };

  const t = content[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");
    if (savedLang === "ar" || savedLang === "en") setLang(savedLang);
  }, []);

  useEffect(() => {
    async function initAdmin() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          router.replace("/login");
          return;
        }

        const token = data.session.access_token;

        const authRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!authRes.ok) {
          router.replace("/login");
          return;
        }

        const user = await authRes.json();

        if (!user || user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setUser(user);
        const cachedOverview = readAdminCache(ADMIN_CACHE_KEYS.overview);

        if (cachedOverview) {
          setOverview(cachedOverview.data);
          setLoading(false);
          loadOverview(token, { background: true });
        } else {
          await loadOverview(token);
        }

        loadUsers({ background: true, token });
        loadPlans({ background: true, token });
        loadLogs({ background: true, token });
      } catch (error) {
        console.error(error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    initAdmin();
  }, [router]);

  async function logout() {
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("dashboard_plans");
    sessionStorage.removeItem("place_categories");
    sessionStorage.removeItem("settings_profile");
    Object.values(ADMIN_CACHE_KEYS).forEach((key) => sessionStorage.removeItem(key));

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }

    router.replace("/login");
  }

  function toggleLanguage() {
    const nextLang = lang === "en" ? "ar" : "en";
    setLang(nextLang);
    localStorage.setItem("site_lang", nextLang);
  }

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  async function loadOverview(tokenParam, options = {}) {
    const cached = readAdminCache(ADMIN_CACHE_KEYS.overview);
    const background = options.background;

    if (cached) {
      setOverview(cached.data);
      if (isFreshCache(cached) && !background) return;
    }

    if (!cached && !background) setSectionLoading(true);
    if (!background) setError("");

    try {
      const token = tokenParam || await getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await safeJson(res);
      if (!res.ok) {
        if (!background) setError(getErrorMessage(result.detail, t.failedOverview));
        return;
      }
      setOverview(result);
      writeAdminCache(ADMIN_CACHE_KEYS.overview, result);
    } catch {
      if (!background) setError(t.unableToConnect);
    } finally {
      if (!background) setSectionLoading(false);
    }
  }

  async function loadUsers(options = {}) {
    const cached = readAdminCache(ADMIN_CACHE_KEYS.users);
    const background = options.background;

    if (cached) {
      setUsers(cached.data);
      if (isFreshCache(cached) && !background) return;
    }

    if (!cached && !background) setSectionLoading(true);
    if (!background) setError("");

    try {
      const token = options.token || await getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await safeJson(res);

      if (!res.ok) {
        if (!background) setError(getErrorMessage(result.detail, t.failedUsers));
        return;
      }

      setUsers(result);
      writeAdminCache(ADMIN_CACHE_KEYS.users, result);
    } catch (error) {
      console.error(error);
      if (!background) setError(t.unableToConnect);
    } finally {
      if (!background) setSectionLoading(false);
    }
  }

  async function loadPlans(options = {}) {
    const cached = readAdminCache(ADMIN_CACHE_KEYS.plans);
    const background = options.background;

    if (cached) {
      setPlans(cached.data);
      if (isFreshCache(cached) && !background) return;
    }

    if (!cached && !background) setSectionLoading(true);
    if (!background) setError("");

    try {
      const token = options.token || await getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await safeJson(res);

      if (!res.ok) {
        if (!background) setError(getErrorMessage(result.detail, t.failedPlans));
        return;
      }

      setPlans(result);
      writeAdminCache(ADMIN_CACHE_KEYS.plans, result);
    } catch (error) {
      console.error(error);
      if (!background) setError(t.unableToConnect);
    } finally {
      if (!background) setSectionLoading(false);
    }
  }

  async function loadLogs(options = {}) {
    const cached = readAdminCache(ADMIN_CACHE_KEYS.logs);
    const background = options.background;

    if (cached) {
      setLogs(cached.data);
      if (isFreshCache(cached) && !background) return;
    }

    if (!cached && !background) setSectionLoading(true);
    if (!background) setError("");

    try {
      const token = options.token || await getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await safeJson(res);

      if (!res.ok) {
        if (!background) setError(getErrorMessage(result.detail, t.failedLogs));
        return;
      }

      setLogs(result);
      writeAdminCache(ADMIN_CACHE_KEYS.logs, result);
    } catch (error) {
      console.error(error);
      if (!background) setError(t.unableToConnect);
    } finally {
      if (!background) setSectionLoading(false);
    }
  }

  async function changeTab(tab) {
    setSidebarOpen(false);
    setActiveTab(tab);

    if (tab === "overview") await loadOverview();
    if (tab === "users") await loadUsers();
    if (tab === "plans") await loadPlans();
    if (tab === "logs") await loadLogs();
  }

  async function updateUser(userId, payload) {
    try {
      const token = await getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        alert(getErrorMessage(result.detail, t.failedUpdateUser));
        return;
      }

      sessionStorage.removeItem(ADMIN_CACHE_KEYS.users);
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert(t.unableToConnect);
    }
  }

  async function toggleUserStatus(user) {
    const userId = user.id;
    const nextIsActive = !user.is_active;
    const confirmed = window.confirm(
      nextIsActive ? t.confirmEnable : t.confirmDisable
    );
    if (!confirmed) return;

    try {
      const token = await getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: nextIsActive }),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        alert(
          getErrorMessage(
            result.detail,
            nextIsActive ? t.failedEnableUser : t.failedDisableUser
          )
        );
        return;
      }

      sessionStorage.removeItem(ADMIN_CACHE_KEYS.users);
      sessionStorage.removeItem(ADMIN_CACHE_KEYS.overview);
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert(t.unableToConnect);
    }
  }

  async function deleteUser(userId) {
    const confirmed = window.confirm(t.confirmDeleteUser);
    if (!confirmed) return;

    try {
      const token = await getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await safeJson(res);

      if (!res.ok) {
        alert(getErrorMessage(result.detail, t.failedDeleteUser));
        return;
      }

      sessionStorage.removeItem(ADMIN_CACHE_KEYS.users);
      sessionStorage.removeItem(ADMIN_CACHE_KEYS.overview);
      sessionStorage.removeItem(ADMIN_CACHE_KEYS.plans);
      sessionStorage.removeItem(ADMIN_CACHE_KEYS.logs);
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert(t.unableToConnect);
    }
  }

  async function updatePlan(planId, payload) {
    try {
      const token = await getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        alert(getErrorMessage(result.detail, t.failedUpdatePlan));
        return;
      }

      sessionStorage.removeItem(ADMIN_CACHE_KEYS.plans);
      sessionStorage.removeItem(ADMIN_CACHE_KEYS.overview);
      await loadPlans();
    } catch (error) {
      console.error(error);
      alert(t.unableToConnect);
    }
  }

  async function deletePlan(planId) {
    const confirmed = window.confirm(t.confirmDeletePlan);
    if (!confirmed) return;

    try {
      const token = await getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/${planId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await safeJson(res);

      if (!res.ok) {
        alert(getErrorMessage(result.detail, t.failedDeletePlan));
        return;
      }

      sessionStorage.removeItem(ADMIN_CACHE_KEYS.plans);
      sessionStorage.removeItem(ADMIN_CACHE_KEYS.overview);
      await loadPlans();
    } catch (error) {
      console.error(error);
      alert(t.unableToConnect);
    }
  }

  if (loading) {
    return <p className={dashboardStyles.loadingText}>{t.loading}</p>;
  }

  return (
    <div
      className={dashboardStyles.dashboardPage}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <header className={dashboardStyles.mobileTopBar}>
        <Link href="/" className={dashboardStyles.mobileBrand}>
          <span className={dashboardStyles.logoMark}></span>
          <span>{t.brand}</span>
        </Link>
        <button
          type="button"
          className={dashboardStyles.mobileMenuButton}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <span aria-hidden="true" className={dashboardStyles.menuIcon}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className={dashboardStyles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        className={`${dashboardStyles.sidebar} ${
          sidebarOpen ? dashboardStyles.sidebarOpen : ""
        }`}
      >
        <div className={dashboardStyles.sidebarMain}>
          <div className={dashboardStyles.sidebarMobileHeader}>
            <span>Navigation</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
            >
              Close
            </button>
          </div>

          <Link
            href="/"
            className={dashboardStyles.brand}
            onClick={() => setSidebarOpen(false)}
          >
            <div className={dashboardStyles.logoMark}></div>
            <span>Alsaeh.bh</span>
          </Link>

          <div className={dashboardStyles.userBox}>
            <p className={dashboardStyles.userLabel}>{t.adminRole}</p>
            <h3 className={dashboardStyles.userName}>{user?.full_name || "-"}</h3>
            <p className={dashboardStyles.userEmail}>{user?.email || "-"}</p>
          </div>

          <nav className={dashboardStyles.nav}>
            <Link
              href="/dashboard"
              className={dashboardStyles.navItem}
              onClick={() => setSidebarOpen(false)}
            >
              {t.dashboard}
            </Link>

            <Link
              href="/dashboard/create-plan"
              className={dashboardStyles.navItem}
              onClick={() => setSidebarOpen(false)}
            >
              {t.createPlan}
            </Link>

            <Link
              href="/dashboard/settings"
              className={dashboardStyles.navItem}
              onClick={() => setSidebarOpen(false)}
            >
              {t.settings}
            </Link>

            <Link
              href="/dashboard/about"
              className={dashboardStyles.navItem}
              onClick={() => setSidebarOpen(false)}
            >
              {t.about}
            </Link>

            <Link
              href="/admin"
              className={`${dashboardStyles.navItem} ${dashboardStyles.activeNavItem}`}
              onClick={() => setSidebarOpen(false)}
            >
              {t.admin}
            </Link>
          </nav>
        </div>

        <div className={dashboardStyles.sidebarBottom}>
          <button className={dashboardStyles.langBtn} onClick={toggleLanguage}>
            {t.langButton}
          </button>

          <button className={dashboardStyles.logoutBtn} onClick={logout}>
            {t.logout}
          </button>
        </div>
      </aside>

      <section className={`${dashboardStyles.contentArea} ${styles.adminContentArea}`}>
        <main className={styles.page}>
          <div className={styles.header}>
            <span className={styles.badge}>{t.adminPanel}</span>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div className={styles.tabs}>
            <button
              className={activeTab === "overview" ? styles.activeTab : ""}
              onClick={() => changeTab("overview")}
            >
              {t.overview}
            </button>

            <button
              className={activeTab === "users" ? styles.activeTab : ""}
              onClick={() => changeTab("users")}
            >
              {t.users}
            </button>

            <button
              className={activeTab === "plans" ? styles.activeTab : ""}
              onClick={() => changeTab("plans")}
            >
              {t.plans}
            </button>

            <button
              className={activeTab === "logs" ? styles.activeTab : ""}
              onClick={() => changeTab("logs")}
            >
              {t.logs}
            </button>
          </div>

          {error && (
            <div className={styles.errorCard}>
              <h2>{t.error}</h2>
              <p>{error}</p>
            </div>
          )}

          {sectionLoading && <p className={styles.loadingText}>{t.loadingData}</p>}

          {!sectionLoading && activeTab === "overview" && (
            <OverviewSection data={overview} t={t} />
          )}

          {!sectionLoading && activeTab === "users" && (
            <UsersSection
              users={users}
              onUpdateUser={updateUser}
              onToggleUserStatus={toggleUserStatus}
              onDeleteUser={deleteUser}
              t={t}
            />
          )}

          {!sectionLoading && activeTab === "plans" && (
            <PlansSection
              plans={plans}
              onUpdatePlan={updatePlan}
              onDeletePlan={deletePlan}
              t={t}
            />
          )}

          {!sectionLoading && activeTab === "logs" && (
            <LogsSection logs={logs} t={t} />
          )}
        </main>
      </section>
    </div>
  );
}

function OverviewSection({ data, t }) {
  if (!data) {
    return (
      <section className={styles.panel}>
        <p className={styles.empty}>{t.noOverview}</p>
      </section>
    );
  }

  return (
    <>
      <section className={styles.statsGrid}>
        <StatCard title={t.totalUsers} value={data.total_users} />
        <StatCard title={t.totalPlans} value={data.total_plans} />
        <StatCard title={t.aiGeneratedPlans} value={data.ai_plans} />
        <StatCard title={t.chatMessages} value={data.total_messages} />
        <StatCard title={t.usageLogs} value={data.total_logs} />
      </section>

      <section className={styles.panel}>
        <h2>{t.popularCategories}</h2>

        {!data.popular_categories || data.popular_categories.length === 0 ? (
          <p className={styles.empty}>{t.noCategoryData}</p>
        ) : (
          <div className={styles.categoryList}>
            {data.popular_categories.map((item, index) => (
              <div key={index} className={styles.categoryItem}>
                <span>{item.category || t.unknown}</span>
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function UsersSection({ users, onUpdateUser, onToggleUserStatus, onDeleteUser, t }) {
  if (!users.length) {
    return (
      <section className={styles.panel}>
        <h2>{t.users}</h2>
        <p className={styles.empty}>{t.noUsers}</p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <h2>{t.users}</h2>

      <div className={styles.tableWrap}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>{t.name}</th>
              <th>{t.email}</th>
              <th>{t.phone}</th>
              <th>{t.role}</th>
              <th>{t.language}</th>
              <th>{t.status}</th>
              <th>{t.actions}</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onUpdateUser={onUpdateUser}
                onToggleUserStatus={onToggleUserStatus}
                onDeleteUser={onDeleteUser}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UserRow({ user, onUpdateUser, onToggleUserStatus, onDeleteUser, t }) {
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
            <option value="true">{t.active}</option>
            <option value="false">{t.disabled}</option>
          </select>
        ) : user.is_active ? (
          t.active
        ) : (
          t.disabled
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
                {t.save}
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
                {t.cancel}
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.smallSecondary}
                onClick={() => setEditing(true)}
              >
                {t.edit}
              </button>

              <button
                className={styles.smallDanger}
                onClick={() => onToggleUserStatus(user)}
              >
                {user.is_active ? t.disable : t.enable}
              </button>

              <button
                className={styles.smallDanger}
                onClick={() => onDeleteUser(user.id)}
              >
                {t.delete}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function PlansSection({ plans, onUpdatePlan, onDeletePlan, t }) {
  if (!plans.length) {
    return (
      <section className={styles.panel}>
        <h2>{t.plans}</h2>
        <p className={styles.empty}>{t.noPlans}</p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <h2>{t.plans}</h2>

      <div className={styles.tableWrap}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>{t.planTitle}</th>
              <th>{t.user}</th>
              <th>{t.days}</th>
              <th>{t.budget}</th>
              <th>{t.people}</th>
              <th>{t.status}</th>
              <th>AI</th>
              <th>{t.actions}</th>
            </tr>
          </thead>

          <tbody>
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                onUpdatePlan={onUpdatePlan}
                onDeletePlan={onDeletePlan}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlanRow({ plan, onUpdatePlan, onDeletePlan, t }) {
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
          plan.title || t.untitled
        )}
      </td>

      <td>
        <strong>{plan.user_name || t.unknown}</strong>
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

      <td>{plan.generated_by_ai ? t.yes : t.no}</td>

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
                {t.save}
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
                {t.cancel}
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.smallSecondary}
                onClick={() => setEditing(true)}
              >
                {t.edit}
              </button>

              <button
                className={styles.smallDanger}
                onClick={() => onDeletePlan(plan.id)}
              >
                {t.delete}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function LogsSection({ logs, t }) {
  if (!logs.length) {
    return (
      <section className={styles.panel}>
        <h2>{t.logs}</h2>
        <p className={styles.empty}>{t.noLogs}</p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <h2>{t.usageLogs}</h2>

      <div className={styles.tableWrap}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>{t.action}</th>
              <th>{t.user}</th>
              <th>{t.entity}</th>
              <th>{t.metadata}</th>
              <th>{t.date}</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.action_type}</td>

                <td>
                  <strong>{log.user_name || t.unknown}</strong>
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
