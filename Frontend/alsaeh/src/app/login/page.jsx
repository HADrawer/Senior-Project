"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./auth.module.css";
import { supabase } from "@/lib/supabase";

function getErrorMessage(error, fallback) {
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();

  const [lang, setLang] = useState("en");
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);

  const content = {
    en: {
      brand: "Alsaeh.bh",
      badge: "Bahrain Tourism AI",
      heroTitle: "Welcome Back",
      heroText: "Continue your Bahrain journey with smart AI-generated travel plans and personalized recommendations.",
      formTitle: "Sign In",
      formSubtitle: "Access your travel plans and tourism recommendations.",
      email: "Email Address",
      emailPlaceholder: "you@example.com",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      show: "Show",
      hide: "Hide",
      submit: "Sign In",
      submitting: "Signing in…",
      switchText: "Don't have an account?",
      switchLink: "Create one",
      fallbackError: "Login failed. Please check your credentials.",
      langButton: "العربية",
      previewPlan: "AI Trip Plan",
      previewDays: "3-day itinerary",
      previewBudget: "Budget: 45 BHD",
    },
    ar: {
      brand: "السائح.البحرين",
      badge: "ذكاء اصطناعي للسياحة",
      heroTitle: "مرحبًا بعودتك",
      heroText: "أكمل رحلتك في البحرين مع خطط سياحية ذكية وتوصيات مخصصة.",
      formTitle: "تسجيل الدخول",
      formSubtitle: "ادخل لتصل إلى خططك السياحية وتوصياتك المخصصة.",
      email: "البريد الإلكتروني",
      emailPlaceholder: "example@email.com",
      password: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      show: "إظهار",
      hide: "إخفاء",
      submit: "دخول",
      submitting: "جاري الدخول…",
      switchText: "ليس لديك حساب؟",
      switchLink: "أنشئ حساباً",
      fallbackError: "فشل تسجيل الدخول. تحقق من بيانات الدخول.",
      langButton: "English",
      previewPlan: "خطة سياحية بالذكاء الاصطناعي",
      previewDays: "جدول لمدة 3 أيام",
      previewBudget: "الميزانية: 45 دينار",
    },
  };

  const t = content[lang];
  const isAr = lang === "ar";

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");
    if (savedLang === "ar" || savedLang === "en") setLang(savedLang);
    setMounted(true);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) router.replace("/dashboard");
      } catch {}
      finally { setCheckingAuth(false); }
    }
    checkAuth();
  }, [router]);

  function toggleLanguage() {
    const newLang = isAr ? "en" : "ar";
    setLang(newLang);
    localStorage.setItem("site_lang", newLang);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        setError(getErrorMessage(error, t.fallbackError));
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError(t.fallbackError);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || checkingAuth) {
    return <div className={styles.pageLoading}>Loading…</div>;
  }

  return (
    <main className={styles.page} dir={isAr ? "rtl" : "ltr"}>
      {/* ── Brand panel ─────────────────────────────────────── */}
      <div className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <Link href="/" className={styles.brandLogo}>
            <span className={styles.brandLogoMark} />
            <span className={styles.brandLogoText}>{t.brand}</span>
          </Link>
          <button className={styles.langBtn} onClick={toggleLanguage}>
            {t.langButton}
          </button>
        </div>

        <div className={styles.brandMiddle}>
          <span className={styles.brandBadge}>{t.badge}</span>
          <h1 className={styles.brandTitle}>{t.heroTitle}</h1>
          <p className={styles.brandText}>{t.heroText}</p>
        </div>

        <div className={styles.brandPreview}>
          <div className={styles.previewCard}>
            <div className={styles.previewRow}>
              <div className={styles.previewIcon}>🗺️</div>
              <div className={styles.previewInfo}>
                <div className={styles.previewLabel}>{t.previewPlan}</div>
                <div className={styles.previewValue}>{t.previewDays}</div>
              </div>
            </div>
            <div className={styles.previewLine} />
            <div className={styles.previewLine} />
          </div>
        </div>
      </div>

      {/* ── Form panel ──────────────────────────────────────── */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>{t.formTitle}</h2>
            <p className={styles.formSubtitle}>{t.formSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                {t.email} <span className={styles.required}>*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t.emailPlaceholder}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                {t.password} <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t.passwordPlaceholder}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className={styles.showPasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t.hide : t.show}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <><span className={styles.spinner} />{t.submitting}</> : t.submit}
            </button>
          </form>

          <p className={styles.switchRow}>
            {t.switchText}
            <Link href="/register" className={styles.switchLink}>
              {t.switchLink}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}