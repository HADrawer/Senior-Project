"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { lang, dir, toggleLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      const cached = sessionStorage.getItem("auth_user");
      if (cached) {
        try {
          setUser(JSON.parse(cached));
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

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });

        if (!res.ok) {
          sessionStorage.clear();
          await supabase.auth.signOut();
          router.replace("/");
          return;
        }

        const userData = await res.json();
        sessionStorage.setItem("auth_user", JSON.stringify(userData));
        setUser(userData);
      } catch {
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    async function verifyAccountStatus() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
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

    const intervalId = window.setInterval(verifyAccountStatus, 15000);
    return () => window.clearInterval(intervalId);
  }, [router]);

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
  );
}
