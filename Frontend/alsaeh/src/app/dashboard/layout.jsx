"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./dashboard.module.css";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import { DashboardProvider } from "./DashboardContext";

const ACCOUNT_STATUS_CHECK_INTERVAL_MS = 5 * 60 * 1000;


export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [dashboardPlans, setDashboardPlans] = useState(null);
  const [dashboardInitLoaded, setDashboardInitLoaded] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { lang, dir, toggleLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const authStarted = useRef(false);
  const lastAccountStatusCheck = useRef(Date.now());

  const t = {
    en: {
      brand: "Alsaeh.bh",
      dashboard: "Dashboard",
      createPlan: "Create Plan",
      about: "About",
      settings: "Settings",
      admin: "Admin",
      chatbot: "Chatbot",
      logout: "Logout",
      welcome: "Welcome",
      langButton: "Arabic",
      loading: "Loading...",
      navigation: "Navigation",
      close: "Close",
      openNavigation: "Open navigation menu",
      closeNavigation: "Close navigation menu",
    },
    ar: {
      brand: "السائح.البحرين",
      dashboard: "لوحة التحكم",
      createPlan: "إنشاء خطة",
      about: "حول",
      settings: "الإعدادات",
      admin: "الإدارة",
      chatbot: "المحادثة",
      logout: "تسجيل الخروج",
      welcome: "مرحباً",
      langButton: "English",
      loading: "جاري التحميل...",
      navigation: "التنقل",
      close: "إغلاق",
      openNavigation: "فتح قائمة التنقل",
      closeNavigation: "إغلاق قائمة التنقل",
    },
  }[lang];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/dashboard/create-plan");
    router.prefetch("/dashboard/about");
    router.prefetch("/dashboard/settings");
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (user?.role === "admin") {
      router.prefetch("/admin");
    }
  }, [router, user?.role]);

  useEffect(() => {
    async function loadUser() {
      if (authStarted.current) return;
      authStarted.current = true;

      const cached = sessionStorage.getItem("auth_user");
      let cachedUser = null;

      if (cached) {
        try {
          cachedUser = JSON.parse(cached);
          setUser(cachedUser);
        } catch {
          sessionStorage.removeItem("auth_user");
        }
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.replace("/login");
          return;
        }

        if (cachedUser && pathname !== "/dashboard") {
          setCheckingAuth(false);
        }

        const accessToken = data.session.access_token;
        setToken(accessToken);

        const endpoint =
          pathname === "/dashboard" ? "/dashboard/init" : "/auth/me";

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          sessionStorage.clear();
          await supabase.auth.signOut();
          router.replace("/");
          return;
        }

        const result = await res.json();
        const userData = result.user || result;

        if (Array.isArray(result.plans)) {
          setDashboardPlans(result.plans);
          sessionStorage.setItem("dashboard_plans", JSON.stringify(result.plans));
          setDashboardInitLoaded(true);
        }

        sessionStorage.setItem("auth_user", JSON.stringify(userData));
        setUser(userData);
      } catch {
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    }

    loadUser();
  }, [pathname, router]);

  useEffect(() => {
    async function loadDashboardPlans() {
      if (pathname !== "/dashboard" || !token || dashboardPlans) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/init`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const result = await res.json();
        const userData = result.user || user;

        if (userData) {
          sessionStorage.setItem("auth_user", JSON.stringify(userData));
          setUser(userData);
        }

        if (Array.isArray(result.plans)) {
          setDashboardPlans(result.plans);
          sessionStorage.setItem("dashboard_plans", JSON.stringify(result.plans));
        }
      } catch {
        return;
      } finally {
        setDashboardInitLoaded(true);
      }
    }

    loadDashboardPlans();
  }, [dashboardPlans, pathname, token, user]);

  useEffect(() => {
    async function verifyAccountStatus() {
      if (!token) return;

      const now = Date.now();
      if (now - lastAccountStatusCheck.current < ACCOUNT_STATUS_CHECK_INTERVAL_MS) {
        return;
      }

      lastAccountStatusCheck.current = now;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          sessionStorage.clear();
          await supabase.auth.signOut();
          router.replace("/");
        }
      } catch {
        return;
      }
    }

    function verifyWhenVisible() {
      if (document.visibilityState === "visible") {
        verifyAccountStatus();
      }
    }

    window.addEventListener("focus", verifyAccountStatus);
    document.addEventListener("visibilitychange", verifyWhenVisible);

    return () => {
      window.removeEventListener("focus", verifyAccountStatus);
      document.removeEventListener("visibilitychange", verifyWhenVisible);
    };
  }, [router, token]);

  function scrollToChatbot() {
    setSidebarOpen(false);

    window.setTimeout(() => {
      document
        .getElementById("plan-chatbot")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  }

  async function logout() {
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("dashboard_plans");
    sessionStorage.removeItem("place_categories");
    sessionStorage.removeItem("settings_profile");

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }

    router.replace("/login");
  }

  if (!mounted || checkingAuth) {
    return <p className={styles.loadingText}>{t.loading}</p>;
  }

  return (
    <DashboardProvider
      value={{
        user,
        token,
        plans: dashboardPlans,
        setPlans: setDashboardPlans,
        initLoaded: dashboardInitLoaded,
      }}
    >
    <main className={styles.dashboardPage} dir={dir}>
      <header className={styles.mobileTopBar}>
        <Link href="/" className={styles.mobileBrand}>
          <span className={styles.logoMark}></span>
          <span>{t.brand}</span>
        </Link>
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setSidebarOpen(true)}
          aria-label={t.openNavigation}
        >
          <span aria-hidden="true" className={styles.menuIcon}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
          aria-label={t.closeNavigation}
        />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarMain}>
          <div className={styles.sidebarMobileHeader}>
            <span>{t.navigation}</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label={t.closeNavigation}
            >
              {t.close}
            </button>
          </div>

          <Link href="/" className={styles.brand} onClick={() => setSidebarOpen(false)}>
            <div className={styles.logoMark}></div>
            <span>{t.brand}</span>
          </Link>

          <div className={styles.userBox}>
            <p className={styles.userLabel}>{t.welcome}</p>
            <h3 className={styles.userName}>{user?.full_name || "-"}</h3>
            <p className={styles.userEmail}>{user?.email || "-"}</p>
          </div>

          <nav className={styles.nav}>
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={`${styles.navItem} ${
                pathname === "/dashboard" ? styles.activeNavItem : ""
              }`}
            >
              {t.dashboard}
            </Link>

            <Link
              href="/dashboard/create-plan"
              onClick={() => setSidebarOpen(false)}
              className={`${styles.navItem} ${
                pathname === "/dashboard/create-plan"
                  ? styles.activeNavItem
                  : ""
              }`}
            >
              {t.createPlan}
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setSidebarOpen(false)}
              className={`${styles.navItem} ${
                pathname === "/dashboard/settings" ? styles.activeNavItem : ""
              }`}
            >
              {t.settings}
            </Link>

            <Link
              href="/dashboard/about"
              onClick={() => setSidebarOpen(false)}
              className={`${styles.navItem} ${
                pathname === "/dashboard/about" ? styles.activeNavItem : ""
              }`}
            >
              {t.about}
            </Link>

            {sidebarOpen && pathname?.startsWith("/dashboard/plans/") && (
              <button
                type="button"
                onClick={scrollToChatbot}
                className={`${styles.navItem} ${styles.mobileOnlyNavItem}`}
              >
                {t.chatbot}
              </button>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`${styles.navItem} ${styles.adminNavItem}`}
              >
                {t.admin}
              </Link>
            )}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <button className={styles.langBtn} onClick={toggleLang}>
            {t.langButton}
          </button>

          <button className={styles.logoutBtn} onClick={logout}>
            {t.logout}
          </button>
        </div>
      </aside>

      <section className={styles.contentArea}>{children}</section>
    </main>
    </DashboardProvider>
  );
}
