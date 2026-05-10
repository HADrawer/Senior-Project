"use client";

import Link from "next/link";
import styles from "../error-pages.module.css";
import { useLanguage } from "@/lib/i18n";

export default function DashboardError({ reset }) {
  const { lang, dir } = useLanguage();
  const t =
    lang === "ar"
      ? {
          title: "خطأ في لوحة التحكم",
          text: "حدث خطأ أثناء تحميل لوحة التحكم. يرجى المحاولة مرة أخرى.",
          retry: "حاول مرة أخرى",
          back: "العودة إلى لوحة التحكم",
        }
      : {
          title: "Dashboard Error",
          text: "Something went wrong while loading the dashboard. Please try again.",
          retry: "Try Again",
          back: "Back to Dashboard",
        };

  return (
    <main className={styles.page} dir={dir}>
      <div className={styles.card}>
        <span className={styles.code}>500</span>
        <h1>{t.title}</h1>
        <p>{t.text}</p>

        <div className={styles.actions}>
          <button onClick={reset} className={styles.primaryBtn}>
            {t.retry}
          </button>

          <Link href="/dashboard" className={styles.secondaryBtn}>
            {t.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
