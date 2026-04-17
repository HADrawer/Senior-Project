"use client";

import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";

const router = useRouter();

export default function DashboardHomePage() {
  const [lang, setLang] = useState("en");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");
    if (savedLang === "ar" || savedLang === "en") {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/my-plans`, {
          credentials: "include",
        });

        if (!res.ok) {
          setError("Failed to load plans");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setPlans(data);
      } catch (error) {
        console.error("Load plans error:", error);
        setError("Unable to connect to server");
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  const content = {
    en: {
      title: "Your Plans",
      subtitle: "View and manage all your saved tourism plans.",
      totalPlans: "Total Plans",
      days: "Days",
      budget: "Budget",
      status: "Status",
      noPlans: "No plans found yet.",
      viewPlan: "View Plan",
      loading: "Loading plans...",
      fallbackTitle: "Untitled Plan",
      serverError: "Something went wrong while loading your plans.",
    },
    ar: {
      title: "خططك السياحية",
      subtitle: "اعرض وأدر جميع خططك السياحية المحفوظة.",
      totalPlans: "إجمالي الخطط",
      days: "الأيام",
      budget: "الميزانية",
      status: "الحالة",
      noPlans: "لا توجد خطط حتى الآن.",
      viewPlan: "عرض الخطة",
      loading: "جاري تحميل الخطط...",
      fallbackTitle: "خطة بدون عنوان",
      serverError: "حدث خطأ أثناء تحميل خططك.",
    },
  };

  const t = content[lang];

  if (loading) {
    return <div className={styles.emptyState}>{t.loading}</div>;
  }

  if (error) {
    return <div className={styles.emptyState}>{t.serverError}</div>;
  }

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t.title}</h1>
          <p className={styles.pageSubtitle}>{t.subtitle}</p>
        </div>

        <div className={styles.statsCard}>
          <span className={styles.statsLabel}>{t.totalPlans}</span>
          <strong className={styles.statsValue}>{plans.length}</strong>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className={styles.emptyState}>{t.noPlans}</div>
      ) : (
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <div key={plan.id} className={styles.planCard}>
              <div className={styles.planTop}>
                <h3 className={styles.planTitle}>
                  {plan.title || t.fallbackTitle}
                </h3>
                <span className={styles.planStatus}>{plan.status}</span>
              </div>

              <p className={styles.planDescription}>
                {plan.preferences || plan.user_interests || plan.travel_styles || "-"}
              </p>

              <div className={styles.planMeta}>
                <span>
                  {t.days}: {plan.days}
                </span>
                <span>
                  {t.budget}: {plan.budget ?? 0} BHD
                </span>
              </div>

              <button
                  className={styles.viewButton}
                  onClick={() => router.push(`/dashboard/plans/${plan.id}`)}
                >
                  {t.viewPlan}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}