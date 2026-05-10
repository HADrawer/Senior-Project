"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/auth.module.css";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

function getErrorMessage(error, fallback) {
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

const COUNTRY_CODES = [
  { country: "Bahrain", code: "+973" },
  { country: "Afghanistan", code: "+93" },
  { country: "Albania", code: "+355" },
  { country: "Algeria", code: "+213" },
  { country: "Andorra", code: "+376" },
  { country: "Angola", code: "+244" },
  { country: "Argentina", code: "+54" },
  { country: "Armenia", code: "+374" },
  { country: "Australia", code: "+61" },
  { country: "Austria", code: "+43" },
  { country: "Azerbaijan", code: "+994" },
  { country: "Bahamas", code: "+1" },
  { country: "Bangladesh", code: "+880" },
  { country: "Barbados", code: "+1" },
  { country: "Belarus", code: "+375" },
  { country: "Belgium", code: "+32" },
  { country: "Belize", code: "+501" },
  { country: "Benin", code: "+229" },
  { country: "Bhutan", code: "+975" },
  { country: "Bolivia", code: "+591" },
  { country: "Bosnia and Herzegovina", code: "+387" },
  { country: "Botswana", code: "+267" },
  { country: "Brazil", code: "+55" },
  { country: "Brunei", code: "+673" },
  { country: "Bulgaria", code: "+359" },
  { country: "Burkina Faso", code: "+226" },
  { country: "Burundi", code: "+257" },
  { country: "Cambodia", code: "+855" },
  { country: "Cameroon", code: "+237" },
  { country: "Canada", code: "+1" },
  { country: "Cape Verde", code: "+238" },
  { country: "Central African Republic", code: "+236" },
  { country: "Chad", code: "+235" },
  { country: "Chile", code: "+56" },
  { country: "China", code: "+86" },
  { country: "Colombia", code: "+57" },
  { country: "Comoros", code: "+269" },
  { country: "Congo", code: "+242" },
  { country: "Costa Rica", code: "+506" },
  { country: "Croatia", code: "+385" },
  { country: "Cuba", code: "+53" },
  { country: "Cyprus", code: "+357" },
  { country: "Czech Republic", code: "+420" },
  { country: "Denmark", code: "+45" },
  { country: "Djibouti", code: "+253" },
  { country: "Dominican Republic", code: "+1" },
  { country: "Ecuador", code: "+593" },
  { country: "Egypt", code: "+20" },
  { country: "El Salvador", code: "+503" },
  { country: "Equatorial Guinea", code: "+240" },
  { country: "Eritrea", code: "+291" },
  { country: "Estonia", code: "+372" },
  { country: "Eswatini", code: "+268" },
  { country: "Ethiopia", code: "+251" },
  { country: "Fiji", code: "+679" },
  { country: "Finland", code: "+358" },
  { country: "France", code: "+33" },
  { country: "Gabon", code: "+241" },
  { country: "Gambia", code: "+220" },
  { country: "Georgia", code: "+995" },
  { country: "Germany", code: "+49" },
  { country: "Ghana", code: "+233" },
  { country: "Greece", code: "+30" },
  { country: "Guatemala", code: "+502" },
  { country: "Guinea", code: "+224" },
  { country: "Guyana", code: "+592" },
  { country: "Haiti", code: "+509" },
  { country: "Honduras", code: "+504" },
  { country: "Hong Kong", code: "+852" },
  { country: "Hungary", code: "+36" },
  { country: "Iceland", code: "+354" },
  { country: "India", code: "+91" },
  { country: "Indonesia", code: "+62" },
  { country: "Iran", code: "+98" },
  { country: "Iraq", code: "+964" },
  { country: "Ireland", code: "+353" },
  { country: "Italy", code: "+39" },
  { country: "Jamaica", code: "+1" },
  { country: "Japan", code: "+81" },
  { country: "Jordan", code: "+962" },
  { country: "Kazakhstan", code: "+7" },
  { country: "Kenya", code: "+254" },
  { country: "Kuwait", code: "+965" },
  { country: "Kyrgyzstan", code: "+996" },
  { country: "Laos", code: "+856" },
  { country: "Latvia", code: "+371" },
  { country: "Lebanon", code: "+961" },
  { country: "Lesotho", code: "+266" },
  { country: "Liberia", code: "+231" },
  { country: "Libya", code: "+218" },
  { country: "Lithuania", code: "+370" },
  { country: "Luxembourg", code: "+352" },
  { country: "Malaysia", code: "+60" },
  { country: "Maldives", code: "+960" },
  { country: "Mali", code: "+223" },
  { country: "Malta", code: "+356" },
  { country: "Mauritania", code: "+222" },
  { country: "Mauritius", code: "+230" },
  { country: "Mexico", code: "+52" },
  { country: "Moldova", code: "+373" },
  { country: "Monaco", code: "+377" },
  { country: "Mongolia", code: "+976" },
  { country: "Montenegro", code: "+382" },
  { country: "Morocco", code: "+212" },
  { country: "Mozambique", code: "+258" },
  { country: "Myanmar", code: "+95" },
  { country: "Namibia", code: "+264" },
  { country: "Nepal", code: "+977" },
  { country: "Netherlands", code: "+31" },
  { country: "New Zealand", code: "+64" },
  { country: "Nicaragua", code: "+505" },
  { country: "Niger", code: "+227" },
  { country: "Nigeria", code: "+234" },
  { country: "North Macedonia", code: "+389" },
  { country: "Norway", code: "+47" },
  { country: "Oman", code: "+968" },
  { country: "Pakistan", code: "+92" },
  { country: "Palestine", code: "+970" },
  { country: "Panama", code: "+507" },
  { country: "Papua New Guinea", code: "+675" },
  { country: "Paraguay", code: "+595" },
  { country: "Peru", code: "+51" },
  { country: "Philippines", code: "+63" },
  { country: "Poland", code: "+48" },
  { country: "Portugal", code: "+351" },
  { country: "Qatar", code: "+974" },
  { country: "Romania", code: "+40" },
  { country: "Russia", code: "+7" },
  { country: "Rwanda", code: "+250" },
  { country: "Saudi Arabia", code: "+966" },
  { country: "Senegal", code: "+221" },
  { country: "Serbia", code: "+381" },
  { country: "Seychelles", code: "+248" },
  { country: "Sierra Leone", code: "+232" },
  { country: "Singapore", code: "+65" },
  { country: "Slovakia", code: "+421" },
  { country: "Slovenia", code: "+386" },
  { country: "Somalia", code: "+252" },
  { country: "South Africa", code: "+27" },
  { country: "South Korea", code: "+82" },
  { country: "Spain", code: "+34" },
  { country: "Sri Lanka", code: "+94" },
  { country: "Sudan", code: "+249" },
  { country: "Sweden", code: "+46" },
  { country: "Switzerland", code: "+41" },
  { country: "Syria", code: "+963" },
  { country: "Taiwan", code: "+886" },
  { country: "Tajikistan", code: "+992" },
  { country: "Tanzania", code: "+255" },
  { country: "Thailand", code: "+66" },
  { country: "Tunisia", code: "+216" },
  { country: "Turkey", code: "+90" },
  { country: "Turkmenistan", code: "+993" },
  { country: "Uganda", code: "+256" },
  { country: "Ukraine", code: "+380" },
  { country: "United Arab Emirates", code: "+971" },
  { country: "United Kingdom", code: "+44" },
  { country: "United States", code: "+1" },
  { country: "Uruguay", code: "+598" },
  { country: "Uzbekistan", code: "+998" },
  { country: "Venezuela", code: "+58" },
  { country: "Vietnam", code: "+84" },
  { country: "Yemen", code: "+967" },
  { country: "Zambia", code: "+260" },
  { country: "Zimbabwe", code: "+263" },
];

export default function RegisterPage() {
  const router = useRouter();

  const { lang, dir, toggleLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    country: "Bahrain",
    phone_number: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const content = {
    en: {
      brand: "Alsaeh.bh",
      badge: "Bahrain Tourism AI",
      heroTitle: "Create Your Account",
      heroText:
        "Start building personalized Bahrain tourism plans based on your interests, budget, and time.",
      formTitle: "Create Account",
      formSubtitle: "Register to save your travel plans and recommendations.",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      email: "Email Address",
      emailPlaceholder: "you@example.com",
      phone: "Phone Number",
      phonePlaceholder: "Enter your phone number",
      password: "Password",
      passwordPlaceholder: "Create your password",
      show: "Show",
      hide: "Hide",
      submit: "Create Account",
      submitting: "Creating account...",
      switchText: "Already have an account?",
      switchLink: "Sign in",
      fallbackError: "Registration failed. Please check your details.",
      googleError: "Google sign-in failed. Please try again.",
      success:
        "Account created. Please check your email to confirm your account before logging in.",
      langButton: "Arabic",
      continueWithGoogle: "Continue with Google",
      orContinueWith: "or continue with",
      previewPlan: "New Trip Plan",
      previewDays: "Personalized itinerary",
    },
    ar: {
      brand: "السائح.البحرين",
      badge: "ذكاء اصطناعي للسياحة",
      heroTitle: "أنشئ حسابك",
      heroText:
        "ابدأ بإنشاء خطط سياحية مخصصة في البحرين حسب اهتماماتك وميزانيتك ووقتك.",
      formTitle: "إنشاء حساب",
      formSubtitle: "سجل لحفظ خططك السياحية وتوصياتك.",
      fullName: "الاسم الكامل",
      fullNamePlaceholder: "أدخل اسمك الكامل",
      email: "البريد الإلكتروني",
      emailPlaceholder: "you@example.com",
      phone: "رقم الهاتف",
      phonePlaceholder: "أدخل رقم هاتفك",
      password: "كلمة المرور",
      passwordPlaceholder: "أنشئ كلمة المرور",
      show: "إظهار",
      hide: "إخفاء",
      submit: "إنشاء حساب",
      submitting: "جاري إنشاء الحساب...",
      switchText: "لديك حساب بالفعل؟",
      switchLink: "تسجيل الدخول",
      fallbackError: "فشل إنشاء الحساب. يرجى التحقق من البيانات.",
      googleError: "فشل تسجيل الدخول باستخدام Google. يرجى المحاولة مرة أخرى.",
      success:
        "تم إنشاء الحساب. يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول.",
      langButton: "English",
      continueWithGoogle: "المتابعة باستخدام Google",
      orContinueWith: "أو تابع باستخدام",
      previewPlan: "خطة رحلة جديدة",
      previewDays: "جدول مخصص",
    },
  };

  const t = content[lang];
  const isAr = lang === "ar";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) router.replace("/dashboard");
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  function handlePhoneChange(e) {
    setForm({ ...form, phone_number: e.target.value.replace(/\D/g, "") });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const selectedCountry =
      COUNTRY_CODES.find(({ country }) => country === form.country) ||
      COUNTRY_CODES[0];
    const fullPhoneNumber = `${selectedCountry.code}${form.phone_number}`;

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: form.full_name,
            phone_number: fullPhoneNumber,
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
        country: "Bahrain",
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

  async function handleGoogleSignIn() {
    setError("");
    setSuccess("");
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
    return (
      <div className={styles.pageLoading}>
        {lang === "ar" ? "جاري التحميل..." : "Loading..."}
      </div>
    );
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
              <div className={styles.previewIcon}>+</div>
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
            {oauthLoading
              ? lang === "ar"
                ? "جاري التحميل..."
                : "Loading..."
              : t.continueWithGoogle}
          </button>

          <div className={styles.oauthDivider}>
            <span>{t.orContinueWith}</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="full_name" className={styles.label}>
                {t.fullName} <span className={styles.required}>*</span>
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder={t.fullNamePlaceholder}
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                required
              />
            </div>

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
              <label htmlFor="phone_number" className={styles.label}>
                {t.phone} <span className={styles.required}>*</span>
              </label>
              <div className={styles.phoneGroup}>
                <select
                  className={styles.countrySelect}
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  aria-label={lang === "ar" ? "رمز الدولة" : "Country code"}
                >
                  {COUNTRY_CODES.map(({ country, code }) => (
                    <option key={`${country}-${code}`} value={country}>
                      {code} {country}
                    </option>
                  ))}
                </select>
                <input
                  id="phone_number"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel-national"
                  placeholder={t.phonePlaceholder}
                  value={form.phone_number}
                  onChange={handlePhoneChange}
                  onPaste={handlePhoneChange}
                  className={styles.phoneInput}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                {t.password} <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t.passwordPlaceholder}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  className={styles.showPasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t.hide : t.show}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                {error}
              </div>
            )}

            {success && (
              <div
                className={`${styles.alert} ${styles.alertSuccess}`}
                role="status"
              >
                {success}
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
            <Link href="/login" className={styles.switchLink}>
              {t.switchLink}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
