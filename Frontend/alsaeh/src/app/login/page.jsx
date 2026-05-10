"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./auth.module.css";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

function getErrorMessage(error, fallback) {
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();

  const { lang, dir, toggleLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const t = {
    en: {
      brand: "Alsaeh.bh",
      badge: "Bahrain Tourism AI",
      heroTitle: "Welcome Back",
      heroText:
        "Continue your Bahrain journey with smart AI-generated travel plans and personalized recommendations.",
      formTitle: "Sign In",
      formSubtitle: "Access your travel plans and tourism recommendations.",
      email: "Email Address",
      emailPlaceholder: "you@example.com",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      show: "Show",
      hide: "Hide",
      submit: "Sign In",
      submitting: "Signing in...",
      switchText: "Don't have an account?",
      switchLink: "Create one",
      fallbackError: "Login failed. Please check your credentials.",
      googleError: "Google sign-in failed. Please try again.",
      disabledAccount: "This account is disabled. Contact an administrator.",
      continueWithGoogle: "Continue with Google",
      orContinueWith: "or continue with",
      langButton: "العربية",
      previewPlan: "AI Trip Plan",
      previewDays: "3-day itinerary",
      loading: "Loading...",
    },
    ar: {
      brand: "السائح.البحرين",
      badge: "ذكاء اصطناعي للسياحة",
      heroTitle: "مرحباً بعودتك",
      heroText: "أكمل رحلتك في البحرين مع خطط سياحية ذكية وتوصيات مخصصة.",
      formTitle: "تسجيل الدخول",
      formSubtitle: "ادخل للوصول إلى خططك السياحية وتوصياتك المخصصة.",
      email: "البريد الإلكتروني",
      emailPlaceholder: "example@email.com",
      password: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      show: "إظهار",
      hide: "إخفاء",
      submit: "دخول",
      submitting: "جاري الدخول...",
      switchText: "ليس لديك حساب؟",
      switchLink: "أنشئ حساباً",
      fallbackError: "فشل تسجيل الدخول. تحقق من بيانات الدخول.",
      googleError: "فشل تسجيل الدخول باستخدام Google. يرجى المحاولة مرة أخرى.",
      disabledAccount: "هذا الحساب معطل. تواصل مع المسؤول.",
      continueWithGoogle: "المتابعة باستخدام Google",
      orContinueWith: "أو تابع باستخدام",
      langButton: "English",
      previewPlan: "خطة سياحية بالذكاء الاصطناعي",
      previewDays: "جدول لمدة 3 أيام",
      loading: "جاري التحميل...",
    },
  }[lang];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });

        if (res.ok) {
          router.replace("/dashboard");
          return;
        }

        await supabase.auth.signOut();
      } catch {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        setError(getErrorMessage(error, t.fallbackError));
        return;
      }

      const token = data.session?.access_token;
      if (!token) {
        setError(t.fallbackError);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        await supabase.auth.signOut();
        setError(getErrorMessage(result.detail, t.disabledAccount));
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError(t.fallbackError);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setOauthLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(getErrorMessage(error, t.googleError));
        setOauthLoading(false);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError(t.googleError);
      setOauthLoading(false);
    }
  }

  if (!mounted || checkingAuth) {
    return <div className={styles.pageLoading}>{t.loading}</div>;
  }

  return (
    <main className={styles.page} dir={dir}>
      <div className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <Link href="/" className={styles.brandLogo}>
            <span className={styles.brandLogoMark} />
            <span className={styles.brandLogoText}>{t.brand}</span>
          </Link>
          <button className={styles.langBtn} onClick={toggleLang}>
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
              <div className={styles.previewIcon}>AI</div>
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

      <div className={styles.formPanel}>
        <Link href="/" className={styles.mobileHomeLink}>
          <span className={styles.mobileHomeMark} />
          <span>{t.brand}</span>
        </Link>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>{t.formTitle}</h2>
            <p className={styles.formSubtitle}>{t.formSubtitle}</p>
          </div>

          <button
            type="button"
            className={styles.oauthButton}
            onClick={handleGoogleSignIn}
            disabled={oauthLoading || loading}
          >
            <span className={styles.oauthIcon} aria-hidden>
              G
            </span>
            {oauthLoading ? t.loading : t.continueWithGoogle}
          </button>

          <div className={styles.oauthDivider}>
            <span>{t.orContinueWith}</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
                  {showPassword ? t.hide : t.show}
                </button>
              </div>
            </div>

            {error && (
              <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                {error}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  {t.submitting}
                </>
              ) : (
                t.submit
              )}
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
