"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./auth.module.css";

function getErrorMessage(detail, fallback) {
  if (Array.isArray(detail)) {
    return detail[0]?.msg || fallback;
  }

  if (typeof detail === "string") {
    return detail;
  }

  return fallback;
}

export default function LoginPage() {
  const router = useRouter();

  const [lang, setLang] = useState("en");
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);

  const content = {
    en: {
      brand: "Alsaeh.bh",
      badge: "Bahrain Inspired",
      heroTitle: "Welcome Back",
      heroText:
        "Continue your journey through Bahrain with smart travel planning, personalized recommendations, and a modern tourism experience.",
      formTitle: "Login",
      formSubtitle:
        "Sign in to access your travel plans and recommendations.",
      email: "Email",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      submit: "Login",
      submitting: "Logging in...",
      switchText: "Don't have an account?",
      switchLink: "Register",
      connectionError: "Unable to connect to server",
      fallbackError: "Login failed",
      langButton: "العربية",
    },
    ar: {
      brand: "السائح.البحرين",
      badge: "مستوحى من البحرين",
      heroTitle: "مرحبًا بعودتك",
      heroText:
        "أكمل رحلتك في البحرين مع تخطيط سياحي ذكي وتوصيات مخصصة وتجربة حديثة لاستكشاف الأماكن.",
      formTitle: "تسجيل الدخول",
      formSubtitle:
        "سجل دخولك للوصول إلى خططك السياحية وتوصياتك المخصصة.",
      email: "البريد الإلكتروني",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      password: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      submit: "دخول",
      submitting: "جاري تسجيل الدخول...",
      switchText: "ليس لديك حساب؟",
      switchLink: "إنشاء حساب",
      connectionError: "تعذر الاتصال بالخادم",
      fallbackError: "فشل تسجيل الدخول",
      langButton: "English",
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
    async function checkAuth() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: "include",
        });

        if (res.ok) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(data.detail, t.fallbackError));
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(t.connectionError);
      setLoading(false);
    }
  }

  if (!mounted || checkingAuth) {
    return <p className={styles.loadingText}>Loading...</p>;
  }

  return (
    <main className={styles.page} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className={styles.backgroundGlowTop}></div>
      <div className={styles.backgroundGlowBottom}></div>

      <section className={styles.wrapper}>
        <div className={styles.brandSide}>
          <div className={styles.topBar}>
            <Link href="/" className={styles.brandLink}>
              <div className={styles.logoSection}>
                <div className={styles.logoMark}></div>
                <h1 className={styles.logoText}>{t.brand}</h1>
              </div>
            </Link>

            <button className={styles.langBtn} onClick={toggleLanguage}>
              {t.langButton}
            </button>
          </div>

          <span className={styles.badge}>{t.badge}</span>

          <h2 className={styles.heroTitle}>{t.heroTitle}</h2>
          <p className={styles.heroText}>{t.heroText}</p>

          <div className={styles.infoCard}>
            <div className={styles.infoTop}></div>
            <div className={styles.infoCircle}></div>
            <div className={styles.infoLine}></div>
            <div className={styles.infoLineSmall}></div>
          </div>
        </div>

        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>{t.formTitle}</h3>
            <p className={styles.formSubtitle}>{t.formSubtitle}</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t.email}</label>
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{t.password}</label>
                <input
                  type="password"
                  placeholder={t.passwordPlaceholder}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className={styles.input}
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={loading}
              >
                {loading ? t.submitting : t.submit}
              </button>
            </form>

            <p className={styles.switchText}>
              {t.switchText}{" "}
              <Link href="/register" className={styles.switchLink}>
                {t.switchLink}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}