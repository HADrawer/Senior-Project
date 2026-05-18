"use client";

import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { useDashboard } from "./DashboardContext";


const PLANS_CACHE_KEY = "dashboard_plans";
function getPlanTitle(plan, fallback) {
  return plan.title || plan.plan_details_json?.title || fallback;
}

function getPlanDate(plan) {
  if (!plan) return null;
  return plan.created_at || plan.updated_at || plan.saved_at || null;
}

function formatDate(value, lang, fallback) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(lang === "ar" ? "ar-BH" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function splitPreferenceText(value) {
  if (!value) return [];

  return String(value)
    .replace(/(?:Preferences|Extra preferences|Constraints):/gi, ",")
    .split(/[,،|]/)
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

function getPreferenceChips(plan) {
  const source =
    plan.preferences ||
    plan.user_interests ||
    plan.category ||
    plan.travel_styles ||
    "";

  return Array.from(new Set(splitPreferenceText(source))).slice(0, 5);
}

function getMostUsedPreference(plans, fallback) {
  const counts = new Map();

  plans.forEach((plan) => {
    getPreferenceChips(plan).forEach((preference) => {
      const key = preference.toLowerCase();
      const current = counts.get(key) || { label: preference, count: 0 };
      counts.set(key, { ...current, count: current.count + 1 });
    });
  });

  return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.label || fallback;
}

function planMatchesSearch(plan, query, fallbackTitle) {
  if (!query.trim()) return true;

  const text = [
    getPlanTitle(plan, fallbackTitle),
    plan.preferences,
    plan.user_interests,
    plan.travel_styles,
    plan.status,
    plan.days,
    plan.budget,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes(query.trim().toLowerCase());
}

export default function DashboardHomePage() {
  const router = useRouter();
  const {
    user: dashboardUser,
    token,
    plans: dashboardPlans,
    setPlans: setDashboardPlans,
    initLoaded: dashboardInitLoaded,
  } = useDashboard();

  const { lang, dir } = useLanguage();
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSort, setRecentSort] = useState(false);

  const content = {
    en: {
      dashboard: "Dashboard",
      dashboardSubtitle:
        "Keep your Bahrain trips organized, easy to scan, and ready to refine.",
      title: "Your Plans",
      subtitle: "View and manage all your saved tourism plans.",
      totalPlans: "Total Plans",
      lastCreated: "Last Created",
      mostUsedPreference: "Most Used Preference",
      noneYet: "None yet",
      days: "Days",
      budget: "Budget",
      travelStyle: "Travel Style",
      noPlans: "No saved plans yet.",
      noFilteredPlans: "No plans match your search or filter.",
      emptySubtitle:
        "Create your first Bahrain plan and your saved itineraries will appear here.",
      viewPlan: "View Plan",
      createNewPlan: "Create New Plan",
      createFirstPlan: "Create First Bahrain Plan",
      searchPlans: "Search plans",
      searchPlaceholder: "Search by title, preference, status, or style",
      filters: "Filters",
      recent: "Recent",
      loading: "Loading plans...",
      fallbackTitle: "Untitled Plan",
      serverError: "Something went wrong while loading your plans.",
      welcome: "Welcome",
      account: "Account",
      signedInAs: "Signed in as",
      preferenceFallback: "No preference",
      morePreferences: "more",
    },
    ar: {
      dashboard: "لوحة التحكم",
      dashboardSubtitle:
        "نظّم رحلاتك في البحرين واجعل خططك سهلة التصفح والتعديل.",
      title: "خططك السياحية",
      subtitle: "اعرض وأدر جميع خططك السياحية المحفوظة.",
      totalPlans: "إجمالي الخطط",
      lastCreated: "آخر خطة",
      mostUsedPreference: "أكثر تفضيل استخداماً",
      noneYet: "لا يوجد بعد",
      days: "الأيام",
      budget: "الميزانية",
      travelStyle: "نمط الرحلة",
      noPlans: "لا توجد خطط محفوظة حتى الآن.",
      noFilteredPlans: "لا توجد خطط تطابق البحث أو الفلتر.",
      emptySubtitle: "أنشئ أول خطة للبحرين وستظهر خططك المحفوظة هنا.",
      viewPlan: "عرض الخطة",
      createNewPlan: "إنشاء خطة جديدة",
      createFirstPlan: "إنشاء أول خطة للبحرين",
      searchPlans: "البحث في الخطط",
      searchPlaceholder: "ابحث بالعنوان أو التفضيل أو الحالة أو النمط",
      filters: "الفلاتر",
      recent: "الأحدث",
      loading: "جاري تحميل الخطط...",
      fallbackTitle: "خطة بدون عنوان",
      serverError: "حدث خطأ أثناء تحميل خططك.",
      welcome: "مرحباً",
      account: "الحساب",
      signedInAs: "مسجل باسم",
      preferenceFallback: "لا يوجد تفضيل",
      morePreferences: "إضافية",
    },
  };

  const t = content[lang];
  const sortedPlans = [...plans].sort((a, b) => {
    const dateA = new Date(getPlanDate(a) || 0).getTime();
    const dateB = new Date(getPlanDate(b) || 0).getTime();
    return dateB - dateA;
  });
  const lastCreatedPlan = sortedPlans[0];
  const displayPlans = recentSort ? sortedPlans : plans;
  const filteredPlans = displayPlans.filter((plan) =>
    planMatchesSearch(plan, searchQuery, t.fallbackTitle)
  );

  useEffect(() => {
    async function initDashboard() {
      const cached = sessionStorage.getItem(PLANS_CACHE_KEY);
      const cachedUser = sessionStorage.getItem("auth_user");

      if (dashboardUser) {
        setUser(dashboardUser);
      }

      if (Array.isArray(dashboardPlans)) {
        setPlans(dashboardPlans);
        setLoading(false);
        return;
      }

      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          sessionStorage.removeItem("auth_user");
        }
      }

      if (cached) {
        try {
          setPlans(JSON.parse(cached));
          setLoading(false);
        } catch {
          sessionStorage.removeItem(PLANS_CACHE_KEY);
        }
      }

      if (!token || !dashboardInitLoaded) {
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/plans/my-plans`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          if (!cached) setError(t.serverError);
          return;
        }

        const result = await res.json();
        setPlans(result);
        setDashboardPlans(result);
        sessionStorage.setItem(PLANS_CACHE_KEY, JSON.stringify(result));
      } catch (error) {
        console.error("Dashboard error:", error);
        if (!cached) setError(t.serverError);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, [
    dashboardInitLoaded,
    dashboardPlans,
    dashboardUser,
    router,
    setDashboardPlans,
    t.serverError,
    token,
  ]);

  if (loading) {
    return (
      <div className={styles.pageContent} dir={dir}>
        <div className={styles.dashboardHeroSkeleton} aria-label={t.loading}>
          <span />
          <strong />
          <p />
        </div>
        <div className={styles.planGrid}>
          {[0, 1, 2].map((item) => (
            <div key={item} className={styles.planSkeleton}>
              <span />
              <strong />
              <p />
              <p />
              <button aria-hidden />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className={styles.emptyState}>{t.serverError}</div>;
  }

  return (
    <div className={styles.pageContent} dir={dir}>
      <section className={styles.dashboardHero}>
        <div className={styles.dashboardHeroCopy}>
          <h1 className={styles.pageTitle}>
            {t.welcome}, {user?.full_name || "-"}
          </h1>
          <p className={styles.pageSubtitle}>{t.dashboardSubtitle}</p>
          {user?.email && (
            <p className={styles.dashboardEmail}>
              <span>{t.signedInAs}</span>
              <strong>{user.email}</strong>
            </p>
          )}
        </div>

        <button
          type="button"
          className={styles.accountButton}
          onClick={() => router.push("/dashboard/settings")}
        >
          {t.account}
        </button>
      </section>

      <section className={styles.dashboardStatsGrid} aria-label={t.dashboard}>
        <div className={styles.dashboardStatCard}>
          <span>{t.totalPlans}</span>
          <strong>{plans.length}</strong>
        </div>
        <div className={styles.dashboardStatCard}>
          <span>{t.lastCreated}</span>
          <strong>{formatDate(getPlanDate(lastCreatedPlan), lang, t.noneYet)}</strong>
        </div>
        <div className={styles.dashboardStatCard}>
          <span>{t.mostUsedPreference}</span>
          <strong>{getMostUsedPreference(plans, t.preferenceFallback)}</strong>
        </div>
      </section>

      <section className={styles.plansSection}>
        <div className={styles.plansSectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>{t.title}</h2>
            <p className={styles.pageSubtitle}>{t.subtitle}</p>
          </div>

          <button
            type="button"
            className={styles.primaryActionButton}
            onClick={() => router.push("/dashboard/create-plan")}
          >
            {t.createNewPlan}
          </button>
        </div>

        <div className={styles.planToolbar}>
          <label className={styles.planSearch}>
            <span>{t.searchPlans}</span>
            <input
              type="search"
              value={searchQuery}
              placeholder={t.searchPlaceholder}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className={styles.filterChips} aria-label={t.filters}>
            <button
              type="button"
              className={recentSort ? styles.activeFilterChip : ""}
              onClick={() => setRecentSort((current) => !current)}
              aria-pressed={recentSort}
            >
              {t.recent}
            </button>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className={styles.emptyDashboardState}>
            <span>{t.noPlans}</span>
            <p>{t.emptySubtitle}</p>
            <button
              type="button"
              className={styles.primaryActionButton}
              onClick={() => router.push("/dashboard/create-plan")}
            >
              {t.createFirstPlan}
            </button>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className={styles.emptyDashboardState}>
            <span>{t.noFilteredPlans}</span>
          </div>
        ) : (
          <div className={styles.planGrid}>
            {filteredPlans.map((plan) => {
              const allPreferences = splitPreferenceText(
                plan.preferences ||
                  plan.user_interests ||
                  plan.category ||
                  plan.travel_styles ||
                  ""
              );
              const chips = getPreferenceChips(plan);
              const hiddenChipCount = Math.max(0, allPreferences.length - chips.length);

              return (
                <article key={plan.id} className={styles.planCard}>
                  <div className={styles.planTop}>
                    <h3 className={styles.planTitle}>
                      {getPlanTitle(plan, t.fallbackTitle)}
                    </h3>
                    <span className={styles.planStatus}>{plan.status}</span>
                  </div>

                  <div className={styles.preferenceChips}>
                    {chips.length > 0 ? (
                      <>
                        {chips.map((chip) => (
                          <span key={chip}>{chip}</span>
                        ))}
                        {hiddenChipCount > 0 && (
                          <span>
                            +{hiddenChipCount} {t.morePreferences}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{t.preferenceFallback}</span>
                    )}
                  </div>

                  <div className={styles.planInfoGrid}>
                    <div>
                      <span>{t.days}</span>
                      <strong>{plan.days}</strong>
                    </div>
                    <div>
                      <span>{t.budget}</span>
                      <strong>{plan.budget ?? 0} BHD</strong>
                    </div>
                    <div>
                      <span>{t.travelStyle}</span>
                      <strong>{plan.travel_styles || "-"}</strong>
                    </div>
                  </div>

                  <p className={styles.planDescription}>
                    {plan.preferences ||
                      plan.user_interests ||
                      plan.travel_styles ||
                      "-"}
                  </p>

                  <button
                    className={styles.viewButton}
                    onClick={() => router.push(`/dashboard/plans/${plan.id}`)}
                  >
                    {t.viewPlan}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
