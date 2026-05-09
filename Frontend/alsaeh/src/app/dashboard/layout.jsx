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
      settings: "Settings",
      logout: "Logout",
      welcome: "Welcome",
      langButton: "العربية",
      loading: "Loading...",
    },
    ar: {
      brand: "السائح.البحرين",
      dashboard: "لوحة التحكم",
      createPlan: "إنشاء خطة",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      welcome: "مرحبًا",
      langButton: "English",
      loading: "جاري التحميل...",
    },
  };

  const t = content[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");

    if (savedLang === "ar" || savedLang === "en") {
      setLang(savedLang);
    }

    setMounted(true);
  }, []);

  function toggleLanguage() {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    localStorage.setItem("site_lang", newLang);
  }

useEffect(() => {
  async function loadUser() {
    // Check cache first
    const cached = sessionStorage.getItem("auth_user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
        setCheckingAuth(false);
        return; // ← early return prevents the fetch entirely
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

      const token = data.session.access_token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        router.replace("/login");
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

// Single, correct logout function — clears cache too
async function logout() {
  sessionStorage.removeItem("auth_user");
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout failed:", err);
  }
  router.replace("/login");
}

  async function logout() {
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
        <div>
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