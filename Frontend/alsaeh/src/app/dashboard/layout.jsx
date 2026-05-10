"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [lang, setLang] = useState("en");
  const [mounted, setMounted] = useState(false);

  const content = {
    en: {
      brand: "Alsaeh.bh",
      dashboard: "Dashboard",
      createPlan: "Create Plan",
      about: "About",
      settings: "Settings",
      admin: "Admin",
      logout: "Logout",
      welcome: "Welcome",
      langButton: "Arabic",
      loading: "Loading...",
    },
    ar: {
      brand: "السائح.البحرين",
      dashboard: "لوحة التحكم",
      createPlan: "إنشاء خطة",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      welcome: "مرحبا",
      langButton: "English",
      loading: "جاري التحميل...",
    },
  };

  const t = content[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");
    if (savedLang === "ar" || savedLang === "en") setLang(savedLang);
    setMounted(true);
  }, []);

  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/dashboard/create-plan");
    router.prefetch("/dashboard/about");
    router.prefetch("/dashboard/settings");
  }, [router]);

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

  function toggleLanguage() {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    localStorage.setItem("site_lang", newLang);
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
    <main className={styles.dashboardPage} dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarMain}>
          <Link href="/" className={styles.brand}>
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
              className={`${styles.navItem} ${
                pathname === "/dashboard" ? styles.activeNavItem : ""
              }`}
            >
              {t.dashboard}
            </Link>

            <Link
              href="/dashboard/create-plan"
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
              className={`${styles.navItem} ${
                pathname === "/dashboard/settings" ? styles.activeNavItem : ""
              }`}
            >
              {t.settings}
            </Link>

            <Link
              href="/dashboard/about"
              className={`${styles.navItem} ${
                pathname === "/dashboard/about" ? styles.activeNavItem : ""
              }`}
            >
              {t.about || "About"}
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`${styles.navItem} ${styles.adminNavItem}`}
              >
                {t.admin || "Admin"}
              </Link>
            )}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <button className={styles.langBtn} onClick={toggleLanguage}>
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
