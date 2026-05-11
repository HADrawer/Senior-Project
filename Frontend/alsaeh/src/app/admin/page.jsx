"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";
import dashboardStyles from "../dashboard/dashboard.module.css";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

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

function matchesSearch(values, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return values
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function serializeLogsToCsv(logs) {
  const headers = [
    "id",
    "action_type",
    "user_name",
    "user_email",
    "entity_type",
    "entity_id",
    "created_at",
    "metadata",
  ];
  const rows = logs.map((log) => [
    log.id,
    log.action_type,
    log.user_name,
    log.user_email,
    log.entity_type,
    log.entity_id,
    log.created_at,
    JSON.stringify(log.metadata_json || {}),
  ]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function getDownloadDate() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export default function AdminPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const { lang, dir, toggleLang } = useLanguage();
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
      popularPreferences: "Popular Preferences",
      noPreferenceData: "No preference data yet.",
      travelStyles: "Travel Styles",
      noTravelStyleData: "No travel style data yet.",
      authMethods: "Auth Methods",
      noAuthMethodData: "No auth method data yet.",
      totalLabel: "Total",
      googleAuthUsers: "Google Sign In",
      passwordAuthUsers: "Email/Password",
      analyticsLabels: {
        attraction: "Attraction",
        restaurant: "Restaurant",
        cafe: "Cafe",
        activity: "Activity",
        beach: "Beach",
        shopping: "Shopping",
        historical_site: "Historical Site",
        museum: "Museum",
        relaxed: "Relaxed",
        adventure: "Adventure",
        "family-friendly": "Family Friendly",
        friends: "Friends",
        "solo-travel": "Solo Travel",
        cultural: "Cultural",
        "budget-friendly": "Budget Friendly",
        luxury: "Luxury",
      },
      searchUsers: "Search users",
      searchPlans: "Search plans",
      searchLogs: "Search logs",
      noUsersMatch: "No users match your search.",
      noPlansMatch: "No plans match your search.",
      noLogsMatch: "No logs match your search.",
      downloadLogs: "Download Logs",
      downloadJson: "Download JSON",
      downloadCsv: "Download as CSV",
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
      ai: "AI",
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
      popularPreferences: "التفضيلات الشائعة",
      noPreferenceData: "لا توجد بيانات تفضيلات بعد.",
      travelStyles: "أنماط الرحلات",
      noTravelStyleData: "لا توجد بيانات أنماط رحلات بعد.",
      authMethods: "طرق تسجيل الدخول",
      noAuthMethodData: "لا توجد بيانات طرق تسجيل دخول بعد.",
      totalLabel: "الإجمالي",
      googleAuthUsers: "تسجيل الدخول عبر Google",
      passwordAuthUsers: "البريد وكلمة المرور",
      analyticsLabels: {
        attraction: "معالم سياحية",
        restaurant: "مطاعم",
        cafe: "مقاهي",
        activity: "أنشطة",
        beach: "شواطئ",
        shopping: "تسوق",
        historical_site: "مواقع تاريخية",
        museum: "متاحف",
        relaxed: "هادئ",
        adventure: "مغامرة",
        "family-friendly": "مناسب للعائلة",
        friends: "الأصدقاء",
        "solo-travel": "رحلة فردية",
        cultural: "ثقافي",
        "budget-friendly": "اقتصادي",
        luxury: "فاخر",
      },
      searchUsers: "البحث في المستخدمين",
      searchPlans: "البحث في الخطط",
      searchLogs: "البحث في السجلات",
      noUsersMatch: "لا يوجد مستخدمون يطابقون البحث.",
      noPlansMatch: "لا توجد خطط تطابق البحث.",
      noLogsMatch: "لا توجد سجلات تطابق البحث.",
      downloadLogs: "تنزيل السجلات",
      downloadJson: "تنزيل JSON",
      downloadCsv: "تنزيل كملف CSV",
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

  const t = {
    ...content[lang],
    ai: lang === "ar" ? "الذكاء الاصطناعي" : content[lang].ai,
    about: lang === "ar" ? "حول" : content[lang].about,
  };

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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/toggle-status`, {
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
      dir={dir}
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
          aria-label={lang === "ar" ? "فتح قائمة التنقل" : "Open navigation menu"}
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
          aria-label={lang === "ar" ? "إغلاق قائمة التنقل" : "Close navigation menu"}
        />
      )}

      <aside
        className={`${dashboardStyles.sidebar} ${
          sidebarOpen ? dashboardStyles.sidebarOpen : ""
        }`}
      >
        <div className={dashboardStyles.sidebarMain}>
          <div className={dashboardStyles.sidebarMobileHeader}>
            <span>{lang === "ar" ? "التنقل" : "Navigation"}</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label={lang === "ar" ? "إغلاق قائمة التنقل" : "Close navigation menu"}
            >
              {lang === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>

          <Link
            href="/"
            className={dashboardStyles.brand}
            onClick={() => setSidebarOpen(false)}
          >
            <div className={dashboardStyles.logoMark}></div>
            <span>{t.brand}</span>
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
          <button className={dashboardStyles.langBtn} onClick={toggleLang}>
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
              onToggleUserStatus={toggleUserStatus}
              onDeleteUser={deleteUser}
              t={t}
            />
          )}

          {!sectionLoading && activeTab === "plans" && (
            <PlansSection
              plans={plans}
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

      <section className={styles.analyticsGrid}>
        <AnalyticsChartCard
          title={t.popularPreferences}
          emptyText={t.noPreferenceData}
          items={data.popular_preferences}
          labelKey="preference"
          ariaLabel={t.popularPreferences}
          t={t}
        />
        <AnalyticsChartCard
          title={t.travelStyles}
          emptyText={t.noTravelStyleData}
          items={data.popular_travel_styles}
          labelKey="travel_style"
          ariaLabel={t.travelStyles}
          t={t}
        />
        <AnalyticsChartCard
          title={t.authMethods}
          emptyText={t.noAuthMethodData}
          items={[
            { auth_method: t.googleAuthUsers, total: data.google_auth_users || 0 },
            { auth_method: t.passwordAuthUsers, total: data.password_auth_users || 0 },
          ].filter((item) => item.total > 0)}
          labelKey="auth_method"
          ariaLabel={t.authMethods}
          t={t}
        />
      </section>
    </>
  );
}

function AnalyticsChartCard({ title, emptyText, items, labelKey, ariaLabel, t }) {
  return (
    <div className={styles.chartCard}>
      <h2>{title}</h2>
      {!items || items.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <AnalyticsPieChart
          items={items}
          labelKey={labelKey}
          ariaLabel={ariaLabel}
          t={t}
        />
      )}
    </div>
  );
}

function AnalyticsPieChart({ items, labelKey, ariaLabel, t }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const slices = items.reduce(
    (acc, item, index) => {
      const value = Number(item.total || 0);
      const start = total > 0 ? acc.runningTotal / total : 0;
      const nextTotal = acc.runningTotal + value;
      const end = total > 0 ? nextTotal / total : 0;
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

      return {
        runningTotal: nextTotal,
        items: [
          ...acc.items,
          {
            ...item,
            value,
            path: describeSlice(100, 100, 78, start, end),
            colorClass: styles[`pieSlice${(index % 8) + 1}`],
            label: item[labelKey] || t.unknown,
            percentage,
          },
        ],
      };
    },
    { runningTotal: 0, items: [] }
  ).items;

  return (
    <div className={styles.pieChartWrap}>
      <svg className={styles.pieChart} viewBox="0 0 200 200" role="img" aria-label={ariaLabel}>
        {slices.map((slice, index) => (
          <path
            key={`${slice.label}-${index}`}
            className={`${styles.pieSlice} ${slice.colorClass}`}
            d={slice.path}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            tabIndex={0}
          >
            <title>{`${formatAnalyticsLabel(slice.label, t)}: ${slice.total} (${slice.percentage}%)`}</title>
          </path>
        ))}
        <circle cx="100" cy="100" r="42" className={styles.pieCenter} />
        <text x="100" y="96" textAnchor="middle" className={styles.pieCenterValue}>
          {total}
        </text>
        <text x="100" y="114" textAnchor="middle" className={styles.pieCenterLabel}>
          {t.totalLabel}
        </text>
      </svg>

      <div className={styles.pieLegend}>
        {slices.map((slice, index) => (
          <div
            key={`${slice.label}-legend-${index}`}
            className={`${styles.pieLegendItem} ${hoveredIndex === index ? styles.activeLegendItem : ""} ${slice.colorClass}`}
            title={`${formatAnalyticsLabel(slice.label, t)}: ${slice.total} (${slice.percentage}%)`}
          >
            <span className={`${styles.pieLegendSwatch} ${slice.colorClass}`} />
            <strong>{formatAnalyticsLabel(slice.label, t)}</strong>
            <span>{slice.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAnalyticsLabel(value, t) {
  const rawValue = String(value || "");
  if (t.analyticsLabels?.[rawValue]) return t.analyticsLabels[rawValue];

  return rawValue
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function polarToCartesian(centerX, centerY, radius, fraction) {
  const angle = fraction * 360 - 90;
  const radians = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function describeSlice(x, y, radius, startFraction, endFraction) {
  if (endFraction - startFraction >= 0.9999) {
    return [
      `M ${x} ${y}`,
      `m 0 -${radius}`,
      `a ${radius} ${radius} 0 1 1 0 ${radius * 2}`,
      `a ${radius} ${radius} 0 1 1 0 -${radius * 2}`,
      "Z",
    ].join(" ");
  }

  const start = polarToCartesian(x, y, radius, endFraction);
  const end = polarToCartesian(x, y, radius, startFraction);
  const largeArcFlag = endFraction - startFraction <= 0.5 ? "0" : "1";

  return [
    `M ${x} ${y}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function UsersSection({ users, onToggleUserStatus, onDeleteUser, t }) {
  const [search, setSearch] = useState("");
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesSearch([user.full_name, user.email, user.role], search)
      ),
    [users, search]
  );

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <h2>{t.users}</h2>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder={t.searchUsers} />

      {!users.length ? (
        <p className={styles.empty}>{t.noUsers}</p>
      ) : !filteredUsers.length ? (
        <p className={styles.empty}>{t.noUsersMatch}</p>
      ) : (
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
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onToggleUserStatus={onToggleUserStatus}
                  onDeleteUser={onDeleteUser}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UserRow({ user, onToggleUserStatus, onDeleteUser, t }) {
  return (
    <tr>
      <td>{user.full_name || "-"}</td>
      <td>{user.email}</td>
      <td>{user.phone_number || "-"}</td>
      <td>{user.role}</td>
      <td>{user.preferred_language}</td>
      <td>{user.is_active ? t.active : t.disabled}</td>
      <td>
        <div className={styles.rowActions}>
          <button
            className={user.is_active ? styles.smallWarning : styles.smallPrimary}
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
        </div>
      </td>
    </tr>
  );
}

function PlansSection({ plans, onDeletePlan, t }) {
  const [search, setSearch] = useState("");
  const filteredPlans = useMemo(
    () =>
      plans.filter((plan) =>
        matchesSearch([plan.title || t.untitled, plan.user_name, plan.user_email], search)
      ),
    [plans, search, t.untitled]
  );

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <h2>{t.plans}</h2>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder={t.searchPlans} />

      {!plans.length ? (
        <p className={styles.empty}>{t.noPlans}</p>
      ) : !filteredPlans.length ? (
        <p className={styles.empty}>{t.noPlansMatch}</p>
      ) : (
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
                <th>{t.ai || "AI"}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>

            <tbody>
              {filteredPlans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  onDeletePlan={onDeletePlan}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PlanRow({ plan, onDeletePlan, t }) {
  return (
    <tr>
      <td>{plan.title || t.untitled}</td>
      <td>
        <strong>{plan.user_name || t.unknown}</strong>
        <br />
        <small>{plan.user_email || "-"}</small>
      </td>
      <td>{plan.days}</td>
      <td>{`${plan.budget ?? 0} BHD`}</td>
      <td>{plan.people_count || 1}</td>
      <td>{plan.status}</td>
      <td>{plan.generated_by_ai ? t.yes : t.no}</td>
      <td>
        <div className={styles.rowActions}>
          <button
            className={styles.smallDanger}
            onClick={() => onDeletePlan(plan.id)}
          >
            {t.delete}
          </button>
        </div>
      </td>
    </tr>
  );
}

function LogsSection({ logs, t }) {
  const [search, setSearch] = useState("");
  const filteredLogs = useMemo(
    () =>
      logs.filter((log) =>
        matchesSearch([log.user_email, log.user_name, log.action_type], search)
      ),
    [logs, search]
  );

  function downloadJson() {
    downloadBlob(
      JSON.stringify(logs, null, 2),
      `alsaeh-system-logs-${getDownloadDate()}.json`,
      "application/json"
    );
  }

  function downloadCsv() {
    downloadBlob(
      serializeLogsToCsv(logs),
      `alsaeh-system-logs-${getDownloadDate()}.csv`,
      "text/csv;charset=utf-8"
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <h2>{t.usageLogs}</h2>
        <div className={styles.downloadActions}>
          <button className={styles.smallPrimary} onClick={downloadJson} disabled={!logs.length}>
            {t.downloadLogs}
          </button>
          <button className={styles.smallSecondary} onClick={downloadCsv} disabled={!logs.length}>
            {t.downloadCsv}
          </button>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder={t.searchLogs} />

      {!logs.length ? (
        <p className={styles.empty}>{t.noLogs}</p>
      ) : !filteredLogs.length ? (
        <p className={styles.empty}>{t.noLogsMatch}</p>
      ) : (
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
              {filteredLogs.map((log) => (
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
      )}
    </section>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <label className={styles.searchBox}>
      <span>{placeholder}</span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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
