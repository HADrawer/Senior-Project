"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/auth.module.css";
import { supabase } from "@/lib/supabase";

function getErrorMessage(error, fallback) {
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export default function RegisterPage() {
  const router = useRouter();

  const [lang, setLang] = useState("en");
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);

  const content = {
    en: {
      brand: "Alsaeh.bh",
      badge: "Bahrain Inspired",
      heroTitle: "Create Your Account",
      heroText:
        "Join Alsaeh.bh and start building personalized tourism experiences across Bahrain based on your interests, budget, and time.",
      formTitle: "Register",
      formSubtitle:
        "Create your account to start exploring Bahrain your way.",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      email: "Email",
      emailPlaceholder: "Enter your email",
      phone: "Phone Number",
      phonePlaceholder: "Enter your phone number",
      password: "Password",
      passwordPlaceholder: "Create your password",
      submit: "Create account",
      submitting: "Creating account...",
      switchText: "Already have an account?",
      switchLink: "Login",
      fallbackError: "Registration failed",
      success:
        "Account created. Please check your email to confirm your account before logging in.",
      langButton: "العربية",
    },
    ar: {
      brand: "السائح.البحرين",
      badge: "مستوحى من البحرين",
      heroTitle: "أنشئ حسابك",
      heroText:
        "انضم إلى السائح.البحرين وابدأ في إنشاء تجارب سياحية مخصصة داخل البحرين حسب اهتماماتك وميزانيتك ووقتك.",
      formTitle: "إنشاء حساب",
      formSubtitle:
        "أنشئ حسابك لتبدأ باستكشاف البحرين بالطريقة التي تناسبك.",
      fullName: "الاسم الكامل",
      fullNamePlaceholder: "أدخل اسمك الكامل",
      email: "البريد الإلكتروني",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      phone: "رقم الهاتف",
      phonePlaceholder: "أدخل رقم الهاتف",
      password: "كلمة المرور",
      passwordPlaceholder: "أنشئ كلمة المرور",
      submit: "إنشاء الحساب",
      submitting: "جاري إنشاء الحساب...",
      switchText: "لديك حساب بالفعل؟",
      switchLink: "تسجيل الدخول",
      fallbackError: "فشل إنشاء الحساب",
      success:
        "تم إنشاء الحساب. يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول.",
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

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();

        if (data.session) {
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

  function toggleLanguage() {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    localStorage.setItem("site_lang", newLang);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: form.full_name,
            phone_number: form.phone_number,
            preferred_language: lang,
          },
        },
      });

      if (error) {
        setError(getErrorMessage(error, t.fallbackError));
        return;
      }

      setSuccess(t.success);

      setForm({
        full_name: "",
        email: "",
        phone_number: "",
        password: "",
      });
    } catch (error) {
      console.error("Register error:", error);
      setError(t.fallbackError);
    } finally {
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
                <label className={styles.label}>{t.fullName}</label>
                <input
                  type="text"
                  placeholder={t.fullNamePlaceholder}
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  className={styles.input}
                  required
                />
              </div>

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
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{t.phone}</label>
                <input
                  type="text"
                  placeholder={t.phonePlaceholder}
                  value={form.phone_number}
                  onChange={(e) =>
                    setForm({ ...form, phone_number: e.target.value })
                  }
                  className={styles.input}
                  required
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
                  required
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              {success && (
                <p className={styles.error} style={{ color: "#166534" }}>
                  {success}
                </p>
              )}

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
              <Link href="/login" className={styles.switchLink}>
                {t.switchLink}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}