"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

const SETTINGS_CACHE_KEY = "settings_profile";
const COUNTRY_CODES = [
  { country: "Bahrain", code: "+973" },
  { country: "Afghanistan", code: "+93" },
  { country: "Albania", code: "+355" },
  { country: "Algeria", code: "+213" },
  { country: "Australia", code: "+61" },
  { country: "Austria", code: "+43" },
  { country: "Bangladesh", code: "+880" },
  { country: "Belgium", code: "+32" },
  { country: "Brazil", code: "+55" },
  { country: "Canada", code: "+1" },
  { country: "China", code: "+86" },
  { country: "Egypt", code: "+20" },
  { country: "France", code: "+33" },
  { country: "Germany", code: "+49" },
  { country: "India", code: "+91" },
  { country: "Indonesia", code: "+62" },
  { country: "Iraq", code: "+964" },
  { country: "Ireland", code: "+353" },
  { country: "Italy", code: "+39" },
  { country: "Japan", code: "+81" },
  { country: "Jordan", code: "+962" },
  { country: "Kuwait", code: "+965" },
  { country: "Lebanon", code: "+961" },
  { country: "Malaysia", code: "+60" },
  { country: "Morocco", code: "+212" },
  { country: "Netherlands", code: "+31" },
  { country: "Oman", code: "+968" },
  { country: "Pakistan", code: "+92" },
  { country: "Palestine", code: "+970" },
  { country: "Philippines", code: "+63" },
  { country: "Qatar", code: "+974" },
  { country: "Saudi Arabia", code: "+966" },
  { country: "Singapore", code: "+65" },
  { country: "South Africa", code: "+27" },
  { country: "Spain", code: "+34" },
  { country: "Syria", code: "+963" },
  { country: "Tunisia", code: "+216" },
  { country: "Turkey", code: "+90" },
  { country: "United Arab Emirates", code: "+971" },
  { country: "United Kingdom", code: "+44" },
  { country: "United States", code: "+1" },
  { country: "Yemen", code: "+967" },
];

function getErrorMessage(detail, fallback) {
  if (Array.isArray(detail)) return detail[0]?.msg || fallback;
  if (typeof detail === "string") return detail;
  return fallback;
}

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (!password) return { label: "", className: "" };
  if (score <= 1) return { label: "Weak", className: "weak" };
  if (score <= 3) return { label: "Medium", className: "medium" };
  return { label: "Strong", className: "strong" };
}

function getAuthProvider(user) {
  const identities = user?.identities || [];
  const hasGoogleIdentity = identities.some(
    (identity) => identity.provider === "google"
  );

  if (hasGoogleIdentity || user?.app_metadata?.provider === "google") {
    return "google";
  }

  return "password";
}

function PasswordVisibilityIcon({ visible }) {
  if (visible) {
    return (
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
    );
  }

  return (
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
  );
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function splitPhoneNumber(phoneNumber) {
  const phone = String(phoneNumber || "");
  const selectedCountry =
    [...COUNTRY_CODES]
      .sort((a, b) => b.code.length - a.code.length)
      .find(({ code }) => phone.startsWith(code)) || COUNTRY_CODES[0];

  return {
    country: selectedCountry.country,
    phone_number: phone.startsWith(selectedCountry.code)
      ? phone.slice(selectedCountry.code.length).replace(/\D/g, "")
      : phone.replace(/\D/g, ""),
  };
}

function normalizeProfile(profile) {
  const phoneDetails = splitPhoneNumber(profile.phone_number);

  return {
    ...profile,
    country: profile.country || phoneDetails.country,
    phone_number:
      profile.country && /^\d*$/.test(profile.phone_number || "")
        ? profile.phone_number
        : phoneDetails.phone_number,
  };
}

function getFullPhoneNumber(profile) {
  const selectedCountry =
    COUNTRY_CODES.find(({ country }) => country === profile.country) ||
    COUNTRY_CODES[0];

  return profile.phone_number
    ? `${selectedCountry.code}${profile.phone_number}`
    : "";
}

export default function SettingsPage() {
  const router = useRouter();

  const { lang, dir, setLang } = useLanguage();
  const [theme, setTheme] = useState("system");
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    country: "Bahrain",
    phone_number: "",
    preferred_language: "en",
  });

  const [emailForm, setEmailForm] = useState({ new_email: "" });
  const [passwordForm, setPasswordForm] = useState({
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOutOtherSessions, setLoggingOutOtherSessions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authProvider, setAuthProvider] = useState("loading");

  const t = {
    en: {
      title: "Settings",
      subtitle: "Manage your account, security, preferences, and privacy.",
      profile: "Profile Information",
      fullName: "Full Name",
      phone: "Phone Number",
      email: "Email",
      save: "Save Changes",
      security: "Security",
      changeEmail: "Change Email",
      newEmail: "New Email",
      changePassword: "Change Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      passwordsDoNotMatch: "New password and confirmation do not match.",
      strength: "Password Strength",
      preferences: "Preferences",
      language: "Language",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      sessions: "Sessions & Devices",
      logoutOtherSessions: "Logout Other Sessions",
      dataPrivacy: "Data & Privacy",
      exportData: "Export My Data",
      deleteAccount: "Delete Account",
      deleteWarning:
        "This permanently deletes your account, plans, logs, and saved profile data. Type DELETE to confirm.",
      support: "Support",
      supportText: "For support, contact the project team or your system administrator.",
      about: "About",
      aboutText:
        "Alsaeh.bh v1.0, University of Bahrain Senior Project, Tourism Recommender System for Bahrain.",
      show: "Show",
      hide: "Hide",
    },
    ar: {
      title: "الإعدادات",
      subtitle: "إدارة الحساب، الأمان، التفضيلات، والخصوصية.",
      profile: "معلومات الحساب",
      fullName: "الاسم الكامل",
      phone: "رقم الهاتف",
      email: "البريد الإلكتروني",
      save: "حفظ التغييرات",
      security: "الأمان",
      changeEmail: "تغيير البريد الإلكتروني",
      newEmail: "البريد الإلكتروني الجديد",
      changePassword: "تغيير كلمة المرور",
      newPassword: "كلمة المرور الجديدة",
      confirmPassword: "تأكيد كلمة المرور الجديدة",
      passwordsDoNotMatch: "كلمة المرور الجديدة والتأكيد غير متطابقين.",
      strength: "قوة كلمة المرور",
      preferences: "التفضيلات",
      language: "اللغة",
      theme: "المظهر",
      light: "فاتح",
      dark: "داكن",
      system: "حسب النظام",
      sessions: "الجلسات والأجهزة",
      logoutOtherSessions: "تسجيل الخروج من الجلسات الأخرى",
      dataPrivacy: "البيانات والخصوصية",
      exportData: "تنزيل بياناتي",
      deleteAccount: "حذف الحساب",
      deleteWarning: "سيتم حذف حسابك وخططك وسجلاتك وبياناتك نهائيا. اكتب DELETE للتأكيد.",
      support: "الدعم",
      supportText: "للدعم، تواصل مع فريق المشروع أو مسؤول النظام.",
      about: "حول التطبيق",
      aboutText:
        "Alsaeh.bh v1.0، مشروع تخرج جامعة البحرين، نظام توصية سياحي للبحرين.",
      show: "إظهار",
      hide: "إخفاء",
    },
  }[lang];

  const ui = {
    en: {
      loading: "Loading...",
      accountStatus: "Account status",
      active: "Active",
      currentEmail: "Current email",
      preferredLanguage: "Preferred language",
      arabic: "Arabic",
      english: "English",
      countryCode: "Country code",
      profileDescription:
        "Keep your travel profile accurate so recommendations and account recovery stay reliable.",
      securityDescription:
        "Email and password changes are handled securely by Supabase Auth.",
      saving: "Saving...",
      profileUpdated: "Profile updated successfully.",
      emailSent: "Email update request sent. Check your email to confirm.",
      emailConfirmed: "Email changed successfully.",
      googleEmailChangeUnavailable:
        "Email changes are not available for Google accounts.",
      emailChangeFailed: "Email change confirmation failed. Please try again.",
      passwordChanged: "Password changed successfully.",
      otherSessionsLoggedOut: "Other sessions have been logged out.",
      exportReady: "Your data export is ready.",
      unableToConnect: "Unable to connect to server",
      unableToUpdateEmail: "Unable to update email",
      unableToUpdatePassword: "Unable to update password",
      unableToLogoutSessions: "Unable to log out other sessions",
      unableToExport: "Unable to export data",
      failedLoad: "Failed to load settings",
      failedUpdateProfile: "Failed to update profile",
      failedChangeEmail: "Failed to change email",
      failedChangePassword: "Failed to change password",
      failedExport: "Failed to export data",
      failedDelete: "Failed to delete account",
      typeDelete: "Type DELETE to confirm account deletion.",
      confirmDelete: "Are you sure you want to delete your account?",
      preferencesDescription:
        "These options update the app experience on this device.",
      sessionsDescription:
        "Revoke active sessions on other browsers and devices while keeping this session active.",
      working: "Working...",
      privacyDescription:
        "Download your stored profile and plans, or permanently delete your account.",
      exporting: "Exporting...",
      deleting: "Deleting...",
      supportDescription: "Need help with your account or trip planning data?",
      version: "Version: Alsaeh.bh v1.0",
      weak: "Weak",
      medium: "Medium",
      strong: "Strong",
    },
    ar: {
      loading: "جاري التحميل...",
      accountStatus: "حالة الحساب",
      active: "نشط",
      currentEmail: "البريد الحالي",
      preferredLanguage: "اللغة المفضلة",
      arabic: "العربية",
      english: "الإنجليزية",
      countryCode: "رمز الدولة",
      profileDescription:
        "حافظ على دقة ملفك الشخصي لتحسين التوصيات واستعادة الحساب.",
      securityDescription:
        "يتم تغيير البريد وكلمة المرور بأمان عبر Supabase Auth.",
      saving: "جاري الحفظ...",
      profileUpdated: "تم تحديث الملف الشخصي بنجاح.",
      emailSent: "تم إرسال طلب تحديث البريد. تحقق من بريدك للتأكيد.",
      emailConfirmed: "تم تغيير البريد الإلكتروني بنجاح.",
      googleEmailChangeUnavailable:
        "Email changes are not available for Google accounts.",
      emailChangeFailed: "فشل تأكيد تغيير البريد. يرجى المحاولة مرة أخرى.",
      passwordChanged: "تم تغيير كلمة المرور بنجاح.",
      otherSessionsLoggedOut: "تم تسجيل الخروج من الجلسات الأخرى.",
      exportReady: "ملف بياناتك جاهز للتنزيل.",
      unableToConnect: "تعذر الاتصال بالخادم",
      unableToUpdateEmail: "تعذر تحديث البريد الإلكتروني",
      unableToUpdatePassword: "تعذر تحديث كلمة المرور",
      unableToLogoutSessions: "تعذر تسجيل الخروج من الجلسات الأخرى",
      unableToExport: "تعذر تنزيل البيانات",
      failedLoad: "فشل تحميل الإعدادات",
      failedUpdateProfile: "فشل تحديث الملف الشخصي",
      failedChangeEmail: "فشل تغيير البريد الإلكتروني",
      failedChangePassword: "فشل تغيير كلمة المرور",
      failedExport: "فشل تنزيل البيانات",
      failedDelete: "فشل حذف الحساب",
      typeDelete: "اكتب DELETE لتأكيد حذف الحساب.",
      confirmDelete: "هل أنت متأكد من حذف حسابك؟",
      preferencesDescription: "تحدث هذه الخيارات تجربة التطبيق على هذا الجهاز.",
      sessionsDescription:
        "ألغِ الجلسات النشطة على المتصفحات والأجهزة الأخرى مع إبقاء هذه الجلسة فعالة.",
      working: "جاري التنفيذ...",
      privacyDescription:
        "نزّل ملفك الشخصي وخططك المحفوظة أو احذف حسابك نهائياً.",
      exporting: "جاري التنزيل...",
      deleting: "جاري الحذف...",
      supportDescription: "هل تحتاج مساعدة في حسابك أو بيانات تخطيط الرحلات؟",
      version: "الإصدار: Alsaeh.bh v1.0",
      weak: "ضعيفة",
      medium: "متوسطة",
      strong: "قوية",
    },
  }[lang];

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordForm.new_password),
    [passwordForm.new_password]
  );

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");
    const savedTheme = localStorage.getItem("theme") || "system";

    if (savedLang === "ar" || savedLang === "en") setLang(savedLang);
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      const cached = sessionStorage.getItem(SETTINGS_CACHE_KEY);

      if (cached) {
        try {
          setProfile(normalizeProfile(JSON.parse(cached)));
          setLoading(false);
        } catch {
          sessionStorage.removeItem(SETTINGS_CACHE_KEY);
        }
      }

      try {
        const token = await getAccessToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError) {
          setError(authError.message || "Failed to load settings");
          return;
        }

        setAuthProvider(getAuthProvider(authData.user));

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(getErrorMessage(data.detail, ui.failedLoad));
          return;
        }

        const phoneDetails = splitPhoneNumber(data.phone_number);
        const nextProfile = {
          full_name: data.full_name || "",
          email: data.email || "",
          country: phoneDetails.country,
          phone_number: phoneDetails.phone_number,
          preferred_language: data.preferred_language || "en",
        };
        setProfile(nextProfile);
        sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(nextProfile));

        const params = new URLSearchParams(window.location.search);
        if (params.get("email_change") === "success") {
          setSuccess("Email changed successfully.");
          window.history.replaceState(null, "", window.location.pathname);
        } else if (params.get("email_change") === "error") {
          setError(
            params.get("message") ||
              "Email change confirmation failed. Please try again."
          );
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (error) {
        console.error(error);
        if (!cached) setError(ui.failedLoad);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router]);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function handleThemeChange(value) {
    setTheme(value);
    localStorage.setItem("theme", value);
    document.documentElement.setAttribute("data-theme", value);
  }

  function handlePhoneChange(e) {
    setProfile({
      ...profile,
      phone_number: e.target.value.replace(/\D/g, ""),
    });
  }

  function handleLanguageChange(e) {
    const nextLanguage = e.target.value;
    setProfile({ ...profile, preferred_language: nextLanguage });
    setLang(nextLanguage);
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    resetMessages();
    setSavingProfile(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const selectedCountry =
        COUNTRY_CODES.find(({ country }) => country === profile.country) ||
        COUNTRY_CODES[0];
      const fullPhoneNumber = `${selectedCountry.code}${profile.phone_number}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone_number: fullPhoneNumber,
          preferred_language: profile.preferred_language,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(data.detail, ui.failedUpdateProfile));
        return;
      }

      const nextProfile = data.user
        ? {
            full_name: data.user.full_name || profile.full_name,
            email: data.user.email || profile.email,
            ...splitPhoneNumber(data.user.phone_number || fullPhoneNumber),
            preferred_language: data.user.preferred_language || profile.preferred_language,
          }
        : profile;

      setProfile(nextProfile);
      localStorage.setItem("site_lang", nextProfile.preferred_language);
      setLang(nextProfile.preferred_language);
      sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(nextProfile));
      sessionStorage.removeItem("auth_user");
      setSuccess(ui.profileUpdated);
    } catch (error) {
      console.error(error);
      setError(ui.unableToConnect);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    resetMessages();

    if (authProvider === "google") {
      setError(ui.googleEmailChangeUnavailable);
      return;
    }

    setSavingEmail(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        "/dashboard/settings"
      )}&type=email_change`;
      const { error } = await supabase.auth.updateUser(
        { email: emailForm.new_email },
        { emailRedirectTo: redirectTo }
      );

      if (error) {
        setError(error.message || ui.failedChangeEmail);
        return;
      }

      setEmailForm({ new_email: "" });
      setSuccess(ui.emailSent);
    } catch (error) {
      console.error(error);
      setError(ui.unableToUpdateEmail);
    } finally {
      setSavingEmail(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    resetMessages();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError(t.passwordsDoNotMatch);
      return;
    }

    setSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      });

      if (error) {
        setError(error.message || ui.failedChangePassword);
        return;
      }

      setPasswordForm({ new_password: "", confirm_password: "" });
      setSuccess(ui.passwordChanged);
    } catch (error) {
      console.error(error);
      setError(ui.unableToUpdatePassword);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogoutOtherSessions() {
    resetMessages();
    setLoggingOutOtherSessions(true);

    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });

      if (error) {
        setError(error.message || ui.unableToLogoutSessions);
        return;
      }

      setSuccess(ui.otherSessionsLoggedOut);
    } catch (error) {
      console.error(error);
      setError(ui.unableToLogoutSessions);
    } finally {
      setLoggingOutOtherSessions(false);
    }
  }

  async function handleExportData() {
    resetMessages();
    setExporting(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/export-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(data.detail, ui.failedExport));
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "alsaeh-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(ui.exportReady);
    } catch (error) {
      console.error(error);
      setError(ui.unableToExport);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    resetMessages();

    if (deleteText !== "DELETE") {
      setError(ui.typeDelete);
      return;
    }

    const confirmed = window.confirm(ui.confirmDelete);
    if (!confirmed) return;

    setDeleting(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(data.detail, ui.failedDelete));
        return;
      }

      sessionStorage.clear();
      await supabase.auth.signOut();
      router.replace("/");
    } catch (error) {
      console.error(error);
      setError(ui.unableToConnect);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className={styles.emptyState}>{ui.loading}</div>;
  }

  return (
    <div className={styles.pageContent} dir={dir}>
      <div className={`${styles.createHeader} ${styles.settingsHero}`}>
        <div>
          <span className={styles.createBadge}>{t.profile}</span>
          <h1 className={styles.pageTitle}>{t.title}</h1>
          <p className={styles.pageSubtitle}>{t.subtitle}</p>
        </div>

        <div className={styles.settingsHeroCard}>
          <span>{ui.accountStatus}</span>
          <strong>{ui.active}</strong>
          <small>{profile.email || "-"}</small>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.successMessage}>{success}</p>}

      <div className={styles.settingsOverviewGrid}>
        <div className={styles.settingsMiniCard}>
          <span>{ui.currentEmail}</span>
          <strong>{profile.email || "-"}</strong>
        </div>
        <div className={styles.settingsMiniCard}>
          <span>{t.phone}</span>
          <strong>{getFullPhoneNumber(profile) || "-"}</strong>
        </div>
        <div className={styles.settingsMiniCard}>
          <span>{ui.preferredLanguage}</span>
          <strong>
            {profile.preferred_language === "ar" ? ui.arabic : ui.english}
          </strong>
        </div>
      </div>

      <div className={styles.settingsLayout}>
        <main className={styles.settingsMainColumn}>
          <form onSubmit={handleProfileSubmit} className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>P</span>
              <div>
                <h2>{t.profile}</h2>
                <p>{ui.profileDescription}</p>
              </div>
            </div>

            <div className={styles.aiFormGrid}>
              <div className={styles.aiField}>
                <label>{t.fullName}</label>
                <input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.aiField}>
                <label>{t.phone}</label>
                <div className={styles.phoneGroup}>
                  <select
                    className={styles.countrySelect}
                    value={profile.country}
                    onChange={(e) =>
                      setProfile({ ...profile, country: e.target.value })
                    }
                    aria-label={ui.countryCode}
                  >
                    {COUNTRY_CODES.map(({ country, code }) => (
                      <option key={`${country}-${code}`} value={country}>
                        {code} {country}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel-national"
                    value={profile.phone_number}
                    onChange={handlePhoneChange}
                    onPaste={handlePhoneChange}
                    className={styles.phoneInput}
                    required
                  />
                </div>
              </div>

              <div className={styles.aiField}>
                <label>{t.email}</label>
                <input value={profile.email} disabled />
              </div>

              <div className={styles.aiField}>
                <label>{t.language}</label>
                <select
                  value={profile.preferred_language}
                  onChange={handleLanguageChange}
                >
                  <option value="en">{ui.english}</option>
                  <option value="ar">{ui.arabic}</option>
                </select>
              </div>
            </div>

            <div className={styles.settingsActions}>
              <button className={styles.aiGenerateButton} disabled={savingProfile}>
                {savingProfile ? ui.saving : t.save}
              </button>
            </div>
          </form>

          <section className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>S</span>
              <div>
                <h2>{t.security}</h2>
                <p>{ui.securityDescription}</p>
              </div>
            </div>

            {authProvider === "google" ? (
              <div className={styles.settingsSubForm}>
                <h3>{t.changeEmail}</h3>
                <p className={styles.settingsText}>
                  {ui.googleEmailChangeUnavailable}
                </p>
              </div>
            ) : authProvider === "password" ? (
              <form onSubmit={handleEmailSubmit} className={styles.settingsSubForm}>
                <h3>{t.changeEmail}</h3>

                <div className={styles.aiFormGrid}>
                  <div className={styles.aiField}>
                    <label>{t.newEmail}</label>
                    <input
                      type="email"
                      value={emailForm.new_email}
                      onChange={(e) => setEmailForm({ new_email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.settingsActions}>
                  <button className={styles.aiGenerateButton} disabled={savingEmail}>
                    {savingEmail ? ui.saving : t.changeEmail}
                  </button>
                </div>
              </form>
            ) : null}

            <form onSubmit={handlePasswordSubmit} className={styles.settingsSubForm}>
              <div className={styles.passwordHeader}>
                <h3>{t.changePassword}</h3>
              </div>

              <div className={styles.aiFormGrid}>
                <div className={styles.aiField}>
                  <label>{t.newPassword}</label>
                  <div className={styles.settingsPasswordWrapper}>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggleButton}
                      onClick={() => setShowPasswords(!showPasswords)}
                      aria-label={showPasswords ? t.hide : t.show}
                    >
                      <PasswordVisibilityIcon visible={showPasswords} />
                    </button>
                  </div>
                </div>

                <div className={styles.aiField}>
                  <label>{t.confirmPassword}</label>
                  <div className={styles.settingsPasswordWrapper}>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirm_password: e.target.value,
                        })
                      }
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggleButton}
                      onClick={() => setShowPasswords(!showPasswords)}
                      aria-label={showPasswords ? t.hide : t.show}
                    >
                      <PasswordVisibilityIcon visible={showPasswords} />
                    </button>
                  </div>
                </div>
              </div>

              {passwordForm.new_password && (
                <div className={styles.passwordStrength}>
                  <span>
                    {t.strength}:{" "}
                    {passwordStrength.className
                      ? ui[passwordStrength.className]
                      : ""}
                  </span>
                  <div className={styles.strengthTrack}>
                    <div
                      className={`${styles.strengthFill} ${
                        passwordStrength.className === "weak"
                          ? styles.weak
                          : passwordStrength.className === "medium"
                          ? styles.medium
                          : styles.strong
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className={styles.settingsActions}>
                <button className={styles.aiGenerateButton} disabled={savingPassword}>
                  {savingPassword ? ui.saving : t.changePassword}
                </button>
              </div>
            </form>
          </section>
        </main>

        <aside className={styles.settingsSideColumn}>
          <section className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>T</span>
              <div>
                <h2>{t.preferences}</h2>
                <p>{ui.preferencesDescription}</p>
              </div>
            </div>

            <div className={styles.aiField}>
              <label>{t.theme}</label>
              <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
                <option value="light">{t.light}</option>
                <option value="dark">{t.dark}</option>
                <option value="system">{t.system}</option>
              </select>
            </div>
          </section>

          <section className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>D</span>
              <div>
                <h2>{t.sessions}</h2>
                <p>{ui.sessionsDescription}</p>
              </div>
            </div>

            <button
              className={styles.secondaryActionButton}
              type="button"
              onClick={handleLogoutOtherSessions}
              disabled={loggingOutOtherSessions}
            >
              {loggingOutOtherSessions ? ui.working : t.logoutOtherSessions}
            </button>
          </section>

          <section className={`${styles.settingsSection} ${styles.dataPrivacySection}`}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>R</span>
              <div>
                <h2>{t.dataPrivacy}</h2>
                <p>{ui.privacyDescription}</p>
              </div>
            </div>

            <button
              className={styles.secondaryActionButton}
              type="button"
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? ui.exporting : t.exportData}
            </button>

            <div className={styles.deleteAccountBox}>
              <h3>{t.deleteAccount}</h3>
              <p>{t.deleteWarning}</p>

              <input
                className={styles.input}
                value={deleteText}
                placeholder="DELETE"
                onChange={(e) => setDeleteText(e.target.value)}
              />

              <button
                className={styles.deleteButton}
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? ui.deleting : t.deleteAccount}
              </button>
            </div>
          </section>

        </aside>
      </div>

    </div>
  );
}
