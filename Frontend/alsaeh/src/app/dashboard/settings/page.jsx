"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import { supabase } from "@/lib/supabase";

const SETTINGS_CACHE_KEY = "settings_profile";

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

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export default function SettingsPage() {
  const router = useRouter();

  const [lang, setLang] = useState("en");
  const [theme, setTheme] = useState("system");
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
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
          setProfile(JSON.parse(cached));
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

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(getErrorMessage(data.detail, "Failed to load settings"));
          return;
        }

        const nextProfile = {
          full_name: data.full_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          preferred_language: data.preferred_language || "en",
        };
        setProfile(nextProfile);
        sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(nextProfile));
      } catch (error) {
        console.error(error);
        if (!cached) setError("Failed to load settings");
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          preferred_language: profile.preferred_language,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(data.detail, "Failed to update profile"));
        return;
      }

      const nextProfile = data.user
        ? {
            full_name: data.user.full_name || profile.full_name,
            email: data.user.email || profile.email,
            phone_number: data.user.phone_number || profile.phone_number,
            preferred_language: data.user.preferred_language || profile.preferred_language,
          }
        : profile;

      setProfile(nextProfile);
      localStorage.setItem("site_lang", nextProfile.preferred_language);
      setLang(nextProfile.preferred_language);
      sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(nextProfile));
      sessionStorage.removeItem("auth_user");
      setSuccess("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    resetMessages();
    setSavingEmail(true);

    try {
      const { error } = await supabase.auth.updateUser({ email: emailForm.new_email });

      if (error) {
        setError(error.message || "Failed to change email");
        return;
      }

      const nextProfile = { ...profile, email: emailForm.new_email };
      setProfile(nextProfile);
      sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(nextProfile));
      setEmailForm({ new_email: "" });
      setSuccess("Email update request sent. Check your email to confirm.");
    } catch (error) {
      console.error(error);
      setError("Unable to update email");
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
        setError(error.message || "Failed to change password");
        return;
      }

      setPasswordForm({ new_password: "", confirm_password: "" });
      setSuccess("Password changed successfully.");
    } catch (error) {
      console.error(error);
      setError("Unable to update password");
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
        setError(error.message || "Unable to log out other sessions");
        return;
      }

      setSuccess("Other sessions have been logged out.");
    } catch (error) {
      console.error(error);
      setError("Unable to log out other sessions");
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
        setError(getErrorMessage(data.detail, "Failed to export data"));
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
      setSuccess("Your data export is ready.");
    } catch (error) {
      console.error(error);
      setError("Unable to export data");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    resetMessages();

    if (deleteText !== "DELETE") {
      setError("Type DELETE to confirm account deletion.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete your account?");
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
        setError(getErrorMessage(data.detail, "Failed to delete account"));
        return;
      }

      sessionStorage.clear();
      await supabase.auth.signOut();
      router.replace("/");
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className={styles.emptyState}>Loading...</div>;
  }

  return (
    <div className={styles.pageContent} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className={`${styles.createHeader} ${styles.settingsHero}`}>
        <div>
          <span className={styles.createBadge}>{t.profile}</span>
          <h1 className={styles.pageTitle}>{t.title}</h1>
          <p className={styles.pageSubtitle}>{t.subtitle}</p>
        </div>

        <div className={styles.settingsHeroCard}>
          <span>Account status</span>
          <strong>Active</strong>
          <small>{profile.email || "-"}</small>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.successMessage}>{success}</p>}

      <div className={styles.settingsOverviewGrid}>
        <div className={styles.settingsMiniCard}>
          <span>Current email</span>
          <strong>{profile.email || "-"}</strong>
        </div>
        <div className={styles.settingsMiniCard}>
          <span>{t.phone}</span>
          <strong>{profile.phone_number || "-"}</strong>
        </div>
        <div className={styles.settingsMiniCard}>
          <span>Preferred language</span>
          <strong>{profile.preferred_language === "ar" ? "Arabic" : "English"}</strong>
        </div>
      </div>

      <div className={styles.settingsLayout}>
        <main className={styles.settingsMainColumn}>
          <form onSubmit={handleProfileSubmit} className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>P</span>
              <div>
                <h2>{t.profile}</h2>
                <p>Keep your travel profile accurate so recommendations and account recovery stay reliable.</p>
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
                <input
                  value={profile.phone_number}
                  onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                  required
                />
              </div>

              <div className={styles.aiField}>
                <label>{t.email}</label>
                <input value={profile.email} disabled />
              </div>

              <div className={styles.aiField}>
                <label>{t.language}</label>
                <select
                  value={profile.preferred_language}
                  onChange={(e) =>
                    setProfile({ ...profile, preferred_language: e.target.value })
                  }
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>

            <div className={styles.settingsActions}>
              <button className={styles.aiGenerateButton} disabled={savingProfile}>
                {savingProfile ? "Saving..." : t.save}
              </button>
            </div>
          </form>

          <section className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>S</span>
              <div>
                <h2>{t.security}</h2>
                <p>Email and password changes are handled securely by Supabase Auth.</p>
              </div>
            </div>

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
                  {savingEmail ? "Saving..." : t.changeEmail}
                </button>
              </div>
            </form>

            <form onSubmit={handlePasswordSubmit} className={styles.settingsSubForm}>
              <div className={styles.passwordHeader}>
                <h3>{t.changePassword}</h3>
                <button
                  type="button"
                  className={styles.smallSecondary}
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? t.hide : t.show}
                </button>
              </div>

              <div className={styles.aiFormGrid}>
                <div className={styles.aiField}>
                  <label>{t.newPassword}</label>
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, new_password: e.target.value })
                    }
                    required
                  />
                </div>

                <div className={styles.aiField}>
                  <label>{t.confirmPassword}</label>
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
                </div>
              </div>

              {passwordForm.new_password && (
                <div className={styles.passwordStrength}>
                  <span>
                    {t.strength}: {passwordStrength.label}
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
                  {savingPassword ? "Saving..." : t.changePassword}
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
                <p>These options update the app experience on this device.</p>
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
                <p>Revoke active sessions on other browsers and devices while keeping this session active.</p>
              </div>
            </div>

            <button
              className={styles.secondaryActionButton}
              type="button"
              onClick={handleLogoutOtherSessions}
              disabled={loggingOutOtherSessions}
            >
              {loggingOutOtherSessions ? "Working..." : t.logoutOtherSessions}
            </button>
          </section>

          <section className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>R</span>
              <div>
                <h2>{t.dataPrivacy}</h2>
                <p>Download your stored profile and plans, or permanently delete your account.</p>
              </div>
            </div>

            <button
              className={styles.secondaryActionButton}
              type="button"
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? "Exporting..." : t.exportData}
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
                {deleting ? "Deleting..." : t.deleteAccount}
              </button>
            </div>
          </section>

          <section className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>?</span>
              <div>
                <h2>{t.support}</h2>
                <p>Need help with your account or trip planning data?</p>
              </div>
            </div>

            <p className={styles.settingsText}>{t.supportText}</p>
            <a href="mailto:info@alsaeh.net" className={styles.supportLink}>
              info@alsaeh.net
            </a>
          </section>

          <section className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <span className={styles.settingsSectionIcon}>i</span>
              <div>
                <h2>{t.about}</h2>
                <p>Version: Alsaeh.bh v1.0</p>
              </div>
            </div>
            <p className={styles.settingsText}>{t.aboutText}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
