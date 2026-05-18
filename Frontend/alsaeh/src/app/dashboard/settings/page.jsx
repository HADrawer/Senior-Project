"use client";


import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

const SETTINGS_CACHE_KEY = "settings_profile";
const PROFILE_FIELD_KEYS = ["full_name", "phone_number", "email", "preferred_language"];
const EMAIL_FIELD_KEYS = ["new_email"];
const PASSWORD_FIELD_KEYS = ["new_password", "confirm_password"];
const SIDE_FIELD_KEYS = ["theme", "sessions", "export_data", "delete_confirm", "delete_account"];
const PROFILE_FEEDBACK_DURATION = 3500;
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

function getChangedProfileFields(currentProfile, savedProfile) {
  const changedFields = [];

  if ((currentProfile.full_name || "").trim() !== (savedProfile.full_name || "").trim()) {
    changedFields.push("full_name");
  }

  if (getFullPhoneNumber(currentProfile) !== getFullPhoneNumber(savedProfile)) {
    changedFields.push("phone_number");
  }

  if ((currentProfile.email || "").trim() !== (savedProfile.email || "").trim()) {
    changedFields.push("email");
  }

  if (currentProfile.preferred_language !== savedProfile.preferred_language) {
    changedFields.push("preferred_language");
  }

  return changedFields;
}

function mapBackendField(field) {
  const fieldName = String(field || "");

  if (fieldName.includes("full_name")) return "full_name";
  if (fieldName.includes("phone")) return "phone_number";
  if (fieldName.includes("email")) return "email";
  if (fieldName.includes("preferred_language") || fieldName.includes("language")) {
    return "preferred_language";
  }

  return null;
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
  const [savedProfile, setSavedProfile] = useState(profile);

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
  const [profileFeedback, setProfileFeedback] = useState({});
  const [emailFeedback, setEmailFeedback] = useState({});
  const [passwordFeedback, setPasswordFeedback] = useState({});
  const [sideFeedback, setSideFeedback] = useState({});
  const [authProvider, setAuthProvider] = useState("loading");
  const profileFeedbackTimer = useRef(null);
  const emailFeedbackTimer = useRef(null);
  const passwordFeedbackTimer = useRef(null);
  const sideFeedbackTimer = useRef(null);

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

  const profileUi = {
    en: {
      updatedSuccessfully: "Updated successfully",
      noProfileChanges: "No profile changes to save.",
      fullNameRequired: "Full name is required.",
      phoneRequired: "Phone number is required.",
      phoneInvalid: "Enter a valid phone number.",
      emailInvalid: "Enter a valid email address.",
      languageRequired: "Choose a language.",
      backendUpdateError: "Backend update error. Please try again.",
    },
    ar: {
      updatedSuccessfully: "تم التحديث بنجاح",
      noProfileChanges: "لا توجد تغييرات في الملف الشخصي لحفظها.",
      fullNameRequired: "الاسم الكامل مطلوب.",
      phoneRequired: "رقم الهاتف مطلوب.",
      phoneInvalid: "أدخل رقم هاتف صحيح.",
      emailInvalid: "أدخل بريدا إلكترونيا صحيحا.",
      languageRequired: "اختر اللغة.",
      backendUpdateError: "حدث خطأ في التحديث. يرجى المحاولة مرة أخرى.",
    },
  }[lang];

  const emailUi = {
    en: {
      emailSent: "Email update request sent. Check your email to confirm.",
      emailRequired: "New email is required.",
      emailInvalid: "Enter a valid email address.",
      googleUnavailable: "Email changes are not available for Google accounts.",
      backendUpdateError: "Backend update error. Please try again.",
    },
    ar: {
      emailSent: "تم إرسال طلب تحديث البريد. تحقق من بريدك للتأكيد.",
      emailRequired: "البريد الإلكتروني الجديد مطلوب.",
      emailInvalid: "أدخل بريدا إلكترونيا صحيحا.",
      googleUnavailable: "تغيير البريد الإلكتروني غير متاح لحسابات Google.",
      backendUpdateError: "حدث خطأ في التحديث. يرجى المحاولة مرة أخرى.",
    },
  }[lang];

  const passwordUi = {
    en: {
      updatedSuccessfully: "Updated successfully",
      passwordRequired: "New password is required.",
      confirmPasswordRequired: "Confirm your new password.",
      passwordsDoNotMatch: "New password and confirmation do not match.",
      passwordTooShort: "Password must be at least 6 characters.",
      backendUpdateError: "Backend update error. Please try again.",
    },
    ar: {
      updatedSuccessfully: "تم التحديث بنجاح",
      passwordRequired: "كلمة المرور الجديدة مطلوبة.",
      confirmPasswordRequired: "أكد كلمة المرور الجديدة.",
      passwordsDoNotMatch: "كلمة المرور الجديدة والتأكيد غير متطابقين.",
      passwordTooShort: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
      backendUpdateError: "حدث خطأ في التحديث. يرجى المحاولة مرة أخرى.",
    },
  }[lang];

  const sideUi = {
    en: {
      updatedSuccessfully: "Updated successfully",
      themeUpdated: "Theme updated successfully",
      sessionsLoggedOut: "Other sessions logged out successfully",
      exportReady: "Export ready",
      typeDelete: "Type DELETE to confirm account deletion.",
      backendUpdateError: "Backend update error. Please try again.",
    },
    ar: {
      updatedSuccessfully: "تم التحديث بنجاح",
      themeUpdated: "تم تحديث المظهر بنجاح",
      sessionsLoggedOut: "تم تسجيل الخروج من الجلسات الأخرى بنجاح",
      exportReady: "ملف التصدير جاهز",
      typeDelete: "اكتب DELETE لتأكيد حذف الحساب.",
      backendUpdateError: "حدث خطأ في التحديث. يرجى المحاولة مرة أخرى.",
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
          const cachedProfile = normalizeProfile(JSON.parse(cached));
          setProfile(cachedProfile);
          setSavedProfile(cachedProfile);
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
        setSavedProfile(nextProfile);
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

  useEffect(() => {
    return () => {
      if (profileFeedbackTimer.current) {
        clearTimeout(profileFeedbackTimer.current);
      }
      if (emailFeedbackTimer.current) {
        clearTimeout(emailFeedbackTimer.current);
      }
      if (passwordFeedbackTimer.current) {
        clearTimeout(passwordFeedbackTimer.current);
      }
      if (sideFeedbackTimer.current) {
        clearTimeout(sideFeedbackTimer.current);
      }
    };
  }, []);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function clearProfileFeedback(fields = PROFILE_FIELD_KEYS) {
    setProfileFeedback((current) => {
      const nextFeedback = { ...current };
      fields.forEach((field) => {
        delete nextFeedback[field];
      });
      return nextFeedback;
    });
  }

  function showProfileFeedback(nextFeedback) {
    if (profileFeedbackTimer.current) {
      clearTimeout(profileFeedbackTimer.current);
    }

    setProfileFeedback(nextFeedback);
    profileFeedbackTimer.current = setTimeout(() => {
      setProfileFeedback({});
      profileFeedbackTimer.current = null;
    }, PROFILE_FEEDBACK_DURATION);
  }

  function getProfileFieldClass(field) {
    const status = profileFeedback[field]?.status;

    if (status === "success") return styles.profileFieldSuccess;
    if (status === "error") return styles.profileFieldError;

    return "";
  }

  function getProfileFieldMessage(field) {
    const feedback = profileFeedback[field];
    if (!feedback) return null;

    return (
      <p
        className={`${styles.profileFieldMessage} ${feedback.status === "success"
            ? styles.profileFieldMessageSuccess
            : styles.profileFieldMessageError
          }`}
      >
        {feedback.message}
      </p>
    );
  }

  function validateProfileChanges(changedFields) {
    const nextFeedback = {};

    if (changedFields.includes("full_name") && !profile.full_name.trim()) {
      nextFeedback.full_name = {
        status: "error",
        message: profileUi.fullNameRequired,
      };
    }

    if (changedFields.includes("phone_number")) {
      if (!profile.phone_number.trim()) {
        nextFeedback.phone_number = {
          status: "error",
          message: profileUi.phoneRequired,
        };
      } else if (!/^\d{5,20}$/.test(profile.phone_number)) {
        nextFeedback.phone_number = {
          status: "error",
          message: profileUi.phoneInvalid,
        };
      }
    }

    if (
      changedFields.includes("email") &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())
    ) {
      nextFeedback.email = {
        status: "error",
        message: profileUi.emailInvalid,
      };
    }

    if (
      changedFields.includes("preferred_language") &&
      !["en", "ar"].includes(profile.preferred_language)
    ) {
      nextFeedback.preferred_language = {
        status: "error",
        message: profileUi.languageRequired,
      };
    }

    return nextFeedback;
  }

  function getBackendProfileFeedback(detail, changedFields) {
    const nextFeedback = {};

    if (Array.isArray(detail)) {
      detail.forEach((item) => {
        const location = Array.isArray(item?.loc) ? item.loc.join(".") : item?.loc;
        const field = mapBackendField(location || item?.field || "");
        if (!field) return;

        nextFeedback[field] = {
          status: "error",
          message: item?.msg || profileUi.backendUpdateError,
        };
      });
    }

    if (Object.keys(nextFeedback).length > 0) {
      return nextFeedback;
    }

    const message = getErrorMessage(detail, profileUi.backendUpdateError);
    changedFields.forEach((field) => {
      nextFeedback[field] = {
        status: "error",
        message,
      };
    });

    return nextFeedback;
  }

  function clearEmailFeedback(fields = EMAIL_FIELD_KEYS) {
    setEmailFeedback((current) => {
      const nextFeedback = { ...current };
      fields.forEach((field) => {
        delete nextFeedback[field];
      });
      return nextFeedback;
    });
  }

  function showEmailFeedback(nextFeedback) {
    if (emailFeedbackTimer.current) {
      clearTimeout(emailFeedbackTimer.current);
    }

    setEmailFeedback(nextFeedback);
    emailFeedbackTimer.current = setTimeout(() => {
      setEmailFeedback({});
      emailFeedbackTimer.current = null;
    }, PROFILE_FEEDBACK_DURATION);
  }

  function getEmailFieldClass(field) {
    const status = emailFeedback[field]?.status;

    if (status === "success") return styles.profileFieldSuccess;
    if (status === "error") return styles.profileFieldError;

    return "";
  }

  function getEmailFieldMessage(field) {
    const feedback = emailFeedback[field];
    if (!feedback) return null;

    return (
      <p
        className={`${styles.profileFieldMessage} ${feedback.status === "success"
            ? styles.profileFieldMessageSuccess
            : styles.profileFieldMessageError
          }`}
      >
        {feedback.message}
      </p>
    );
  }

  function validateEmailForm() {
    const nextEmail = emailForm.new_email.trim();

    if (!nextEmail) {
      return {
        new_email: {
          status: "error",
          message: emailUi.emailRequired,
        },
      };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return {
        new_email: {
          status: "error",
          message: emailUi.emailInvalid,
        },
      };
    }

    return {};
  }

  function clearPasswordFeedback(fields = PASSWORD_FIELD_KEYS) {
    setPasswordFeedback((current) => {
      const nextFeedback = { ...current };
      fields.forEach((field) => {
        delete nextFeedback[field];
      });
      return nextFeedback;
    });
  }

  function showPasswordFeedback(nextFeedback) {
    if (passwordFeedbackTimer.current) {
      clearTimeout(passwordFeedbackTimer.current);
    }

    setPasswordFeedback(nextFeedback);
    passwordFeedbackTimer.current = setTimeout(() => {
      setPasswordFeedback({});
      passwordFeedbackTimer.current = null;
    }, PROFILE_FEEDBACK_DURATION);
  }

  function getPasswordFieldClass(field) {
    const status = passwordFeedback[field]?.status;

    if (status === "success") return styles.profileFieldSuccess;
    if (status === "error") return styles.profileFieldError;

    return "";
  }

  function getPasswordFieldMessage(field) {
    const feedback = passwordFeedback[field];
    if (!feedback) return null;

    return (
      <p
        className={`${styles.profileFieldMessage} ${feedback.status === "success"
            ? styles.profileFieldMessageSuccess
            : styles.profileFieldMessageError
          }`}
      >
        {feedback.message}
      </p>
    );
  }

  function validatePasswordForm() {
    const nextFeedback = {};

    if (!passwordForm.new_password) {
      nextFeedback.new_password = {
        status: "error",
        message: passwordUi.passwordRequired,
      };
    } else if (passwordForm.new_password.length < 6) {
      nextFeedback.new_password = {
        status: "error",
        message: passwordUi.passwordTooShort,
      };
    }

    if (!passwordForm.confirm_password) {
      nextFeedback.confirm_password = {
        status: "error",
        message: passwordUi.confirmPasswordRequired,
      };
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      nextFeedback.confirm_password = {
        status: "error",
        message: passwordUi.passwordsDoNotMatch,
      };
    }

    return nextFeedback;
  }

  function getPasswordBackendFeedback(message) {
    return PASSWORD_FIELD_KEYS.reduce((feedback, field) => {
      feedback[field] = {
        status: "error",
        message,
      };
      return feedback;
    }, {});
  }

  function clearSideFeedback(fields = SIDE_FIELD_KEYS) {
    setSideFeedback((current) => {
      const nextFeedback = { ...current };
      fields.forEach((field) => {
        delete nextFeedback[field];
      });
      return nextFeedback;
    });
  }

  function showSideFeedback(field, status, message) {
    if (sideFeedbackTimer.current) {
      clearTimeout(sideFeedbackTimer.current);
    }

    setSideFeedback({
      [field]: { status, message },
    });
    sideFeedbackTimer.current = setTimeout(() => {
      setSideFeedback({});
      sideFeedbackTimer.current = null;
    }, PROFILE_FEEDBACK_DURATION);
  }

  function getSideFieldClass(field) {
    const status = sideFeedback[field]?.status;

    if (status === "success") return styles.profileFieldSuccess;
    if (status === "error") return styles.profileFieldError;

    return "";
  }

  function getSideFieldMessage(field) {
    const feedback = sideFeedback[field];
    if (!feedback) return null;

    return (
      <p
        className={`${styles.profileFieldMessage} ${feedback.status === "success"
            ? styles.profileFieldMessageSuccess
            : styles.profileFieldMessageError
          }`}
      >
        {feedback.message}
      </p>
    );
  }

  function handleThemeChange(value) {
    resetMessages();
    clearSideFeedback();
    setTheme(value);
    localStorage.setItem("theme", value);
    document.documentElement.setAttribute("data-theme", value);
    showSideFeedback("theme", "success", sideUi.themeUpdated);
  }

  function handlePhoneChange(e) {
    clearProfileFeedback(["phone_number"]);
    setProfile({
      ...profile,
      phone_number: e.target.value.replace(/\D/g, ""),
    });
  }

  function handleLanguageChange(e) {
    const nextLanguage = e.target.value;
    clearProfileFeedback(["preferred_language"]);
    setProfile({ ...profile, preferred_language: nextLanguage });
    setLang(nextLanguage);
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    resetMessages();
    clearProfileFeedback();

    const changedFields = getChangedProfileFields(profile, savedProfile);

    if (changedFields.length === 0) {
      return;
    }

    const validationFeedback = validateProfileChanges(changedFields);

    if (Object.keys(validationFeedback).length > 0) {
      showProfileFeedback(validationFeedback);
      return;
    }

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
        showProfileFeedback(getBackendProfileFeedback(data.detail, changedFields));
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

      const confirmedChangedFields = getChangedProfileFields(nextProfile, savedProfile);
      const successFields =
        confirmedChangedFields.length > 0 ? confirmedChangedFields : changedFields;
      const successFeedback = successFields.reduce((feedback, field) => {
        feedback[field] = {
          status: "success",
          message: profileUi.updatedSuccessfully,
        };
        return feedback;
      }, {});

      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      localStorage.setItem("site_lang", nextProfile.preferred_language);
      setLang(nextProfile.preferred_language);
      sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(nextProfile));
      sessionStorage.removeItem("auth_user");
      showProfileFeedback(successFeedback);
    } catch (error) {
      console.error(error);
      const message = ui.unableToConnect || profileUi.backendUpdateError;
      showProfileFeedback(
        changedFields.reduce((feedback, field) => {
          feedback[field] = {
            status: "error",
            message,
          };
          return feedback;
        }, {})
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    resetMessages();
    clearEmailFeedback();

    if (authProvider === "google") {
      showEmailFeedback({
        new_email: {
          status: "error",
          message: emailUi.googleUnavailable,
        },
      });
      return;
    }

    const validationFeedback = validateEmailForm();

    if (Object.keys(validationFeedback).length > 0) {
      showEmailFeedback(validationFeedback);
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
        showEmailFeedback({
          new_email: {
            status: "error",
            message: error.message || emailUi.backendUpdateError,
          },
        });
        return;
      }

      setEmailForm({ new_email: "" });
      showEmailFeedback({
        new_email: {
          status: "success",
          message: emailUi.emailSent,
        },
      });
    } catch (error) {
      console.error(error);
      showEmailFeedback({
        new_email: {
          status: "error",
          message: ui.unableToUpdateEmail || emailUi.backendUpdateError,
        },
      });
    } finally {
      setSavingEmail(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    resetMessages();
    clearPasswordFeedback();

    const validationFeedback = validatePasswordForm();

    if (Object.keys(validationFeedback).length > 0) {
      showPasswordFeedback(validationFeedback);
      return;
    }

    setSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      });

      if (error) {
        showPasswordFeedback(
          getPasswordBackendFeedback(error.message || passwordUi.backendUpdateError)
        );
        return;
      }

      setPasswordForm({ new_password: "", confirm_password: "" });
      showPasswordFeedback(
        PASSWORD_FIELD_KEYS.reduce((feedback, field) => {
          feedback[field] = {
            status: "success",
            message: passwordUi.updatedSuccessfully,
          };
          return feedback;
        }, {})
      );
    } catch (error) {
      console.error(error);
      showPasswordFeedback(
        getPasswordBackendFeedback(ui.unableToUpdatePassword || passwordUi.backendUpdateError)
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogoutOtherSessions() {
    resetMessages();
    clearSideFeedback();
    setLoggingOutOtherSessions(true);

    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });

      if (error) {
        showSideFeedback(
          "sessions",
          "error",
          error.message || ui.unableToLogoutSessions || sideUi.backendUpdateError
        );
        return;
      }

      showSideFeedback("sessions", "success", sideUi.sessionsLoggedOut);
    } catch (error) {
      console.error(error);
      showSideFeedback(
        "sessions",
        "error",
        ui.unableToLogoutSessions || sideUi.backendUpdateError
      );
    } finally {
      setLoggingOutOtherSessions(false);
    }
  }

  async function handleExportData() {
    resetMessages();
    clearSideFeedback();
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
        showSideFeedback(
          "export_data",
          "error",
          getErrorMessage(data.detail, ui.failedExport || sideUi.backendUpdateError)
        );
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
      showSideFeedback("export_data", "success", sideUi.exportReady);
    } catch (error) {
      console.error(error);
      showSideFeedback(
        "export_data",
        "error",
        ui.unableToExport || sideUi.backendUpdateError
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    resetMessages();
    clearSideFeedback();

    if (deleteText !== "DELETE") {
      showSideFeedback("delete_confirm", "error", sideUi.typeDelete);
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
        showSideFeedback(
          "delete_account",
          "error",
          getErrorMessage(data.detail, ui.failedDelete || sideUi.backendUpdateError)
        );
        return;
      }

      sessionStorage.clear();
      await supabase.auth.signOut();
      router.replace("/");
    } catch (error) {
      console.error(error);
      showSideFeedback(
        "delete_account",
        "error",
        ui.unableToConnect || sideUi.backendUpdateError
      );
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
          <form
            onSubmit={handleProfileSubmit}
            className={styles.settingsSection}
            noValidate
          >
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
                  onChange={(e) => {
                    clearProfileFeedback(["full_name"]);
                    setProfile({ ...profile, full_name: e.target.value });
                  }}
                  className={getProfileFieldClass("full_name")}
                  required
                />
                {getProfileFieldMessage("full_name")}
              </div>

              <div className={styles.aiField}>
                <label>{t.phone}</label>
                <div
                  className={`${styles.phoneGroup} ${getProfileFieldClass(
                    "phone_number"
                  )}`}
                >
                  <select
                    className={styles.countrySelect}
                    value={profile.country}
                    onChange={(e) => {
                      clearProfileFeedback(["phone_number"]);
                      setProfile({ ...profile, country: e.target.value });
                    }}
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
                {getProfileFieldMessage("phone_number")}
              </div>

              <div className={styles.aiField}>
                <label>{t.email}</label>
                <input
                  value={profile.email}
                  className={getProfileFieldClass("email")}
                  disabled
                />
                {getProfileFieldMessage("email")}
              </div>

              <div className={styles.aiField}>
                <label>{t.language}</label>
                <select
                  value={profile.preferred_language}
                  onChange={handleLanguageChange}
                  className={getProfileFieldClass("preferred_language")}
                >
                  <option value="en">{ui.english}</option>
                  <option value="ar">{ui.arabic}</option>
                </select>
                {getProfileFieldMessage("preferred_language")}
              </div>
            </div>

            <div className={styles.settingsActions}>
              <button
                type="submit"
                className={styles.aiGenerateButton}
                disabled={savingProfile}
                aria-busy={savingProfile}
              >
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
              <form
                onSubmit={handleEmailSubmit}
                className={styles.settingsSubForm}
                noValidate
              >
                <h3>{t.changeEmail}</h3>

                <div className={styles.aiFormGrid}>
                  <div className={styles.aiField}>
                    <label>{t.newEmail}</label>
                    <input
                      type="email"
                      value={emailForm.new_email}
                      onChange={(e) => {
                        clearEmailFeedback(["new_email"]);
                        setEmailForm({ new_email: e.target.value });
                      }}
                      className={getEmailFieldClass("new_email")}
                      required
                    />
                    {getEmailFieldMessage("new_email")}
                  </div>
                </div>

                <div className={styles.settingsActions}>
                  <button
                    type="submit"
                    className={styles.aiGenerateButton}
                    disabled={savingEmail}
                    aria-busy={savingEmail}
                  >
                    {savingEmail ? ui.saving : t.changeEmail}
                  </button>
                </div>
              </form>
            ) : null}

            <form
              onSubmit={handlePasswordSubmit}
              className={styles.settingsSubForm}
              noValidate
            >
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
                      onChange={(e) => {
                        clearPasswordFeedback(["new_password", "confirm_password"]);
                        setPasswordForm({ ...passwordForm, new_password: e.target.value });
                      }}
                      className={getPasswordFieldClass("new_password")}
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
                  {getPasswordFieldMessage("new_password")}
                </div>

                <div className={styles.aiField}>
                  <label>{t.confirmPassword}</label>
                  <div className={styles.settingsPasswordWrapper}>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={passwordForm.confirm_password}
                      onChange={(e) => {
                        clearPasswordFeedback(["confirm_password"]);
                        setPasswordForm({
                          ...passwordForm,
                          confirm_password: e.target.value,
                        });
                      }}
                      className={getPasswordFieldClass("confirm_password")}
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
                  {getPasswordFieldMessage("confirm_password")}
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
                      className={`${styles.strengthFill} ${passwordStrength.className === "weak"
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
                <button
                  type="submit"
                  className={styles.aiGenerateButton}
                  disabled={savingPassword}
                  aria-busy={savingPassword}
                >
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
              <select
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className={getSideFieldClass("theme")}
              >
                <option value="light">{t.light}</option>
                <option value="dark">{t.dark}</option>
                <option value="system">{t.system}</option>
              </select>
              {getSideFieldMessage("theme")}
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
              className={`${styles.secondaryActionButton} ${getSideFieldClass(
                "sessions"
              )}`}
              type="button"
              onClick={handleLogoutOtherSessions}
              disabled={loggingOutOtherSessions}
              aria-busy={loggingOutOtherSessions}
            >
              {loggingOutOtherSessions ? ui.working : t.logoutOtherSessions}
            </button>
            {getSideFieldMessage("sessions")}
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
              className={`${styles.secondaryActionButton} ${getSideFieldClass(
                "export_data"
              )}`}
              type="button"
              onClick={handleExportData}
              disabled={exporting}
              aria-busy={exporting}
            >
              {exporting ? ui.exporting : t.exportData}
            </button>
            {getSideFieldMessage("export_data")}

            <div className={styles.deleteAccountBox}>
              <h3>{t.deleteAccount}</h3>
              <p>{t.deleteWarning}</p>

              <input
                className={`${styles.input} ${getSideFieldClass("delete_confirm")}`}
                value={deleteText}
                placeholder="DELETE"
                onChange={(e) => {
                  clearSideFeedback(["delete_confirm", "delete_account"]);
                  setDeleteText(e.target.value);
                }}
              />
              {getSideFieldMessage("delete_confirm")}

              <button
                className={`${styles.deleteButton} ${getSideFieldClass(
                  "delete_account"
                )}`}
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                aria-busy={deleting}
              >
                {deleting ? ui.deleting : t.deleteAccount}
              </button>
              {getSideFieldMessage("delete_account")}
            </div>
          </section>

        </aside>
      </div>

    </div>
  );
}
