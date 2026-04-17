"use client";

import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";

export default function DashboardHomePage() {
  const [lang, setLang] = useState("en");

  const [plans] = useState([
    {
      id: 1,
      title: "Weekend in Bahrain",
      days: 2,
      budget: 40,
      status: "saved",
      description: "A short weekend plan including cafes, seaside spots, and local attractions.",
    },
    {
      id: 2,
      title: "Cultural Bahrain Trip",
      days: 3,
      budget: 75,
      status: "saved",
      description: "A cultural plan focused on museums, heritage places, and historical sites.",
    },
    {
      id: 3,
      title: "Family Fun Plan",
      days: 1,
      budget: 30,
      status: "draft",
      description: "A simple family-friendly day with restaurants, activities, and shopping.",
    },
  ]);

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");
    if (savedLang === "ar" || savedLang === "en") {
      setLang(savedLang);
    }
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
    },
  };

  const t = content[lang];

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
                <h3 className={styles.planTitle}>{plan.title}</h3>
                <span className={styles.planStatus}>{plan.status}</span>
              </div>

              <p className={styles.planDescription}>{plan.description}</p>

              <div className={styles.planMeta}>
                <span>
                  {t.days}: {plan.days}
                </span>
                <span>
                  {t.budget}: {plan.budget} BHD
                </span>
              </div>

              <button className={styles.viewButton}>{t.viewPlan}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}