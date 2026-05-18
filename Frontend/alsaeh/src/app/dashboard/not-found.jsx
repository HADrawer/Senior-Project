"use client";


import Link from "next/link";
import styles from "../error-pages.module.css";
import { useLanguage } from "@/lib/i18n";

export default function DashboardNotFound() {
  const { lang, dir } = useLanguage();
  const t =
    lang === "ar"
      ? {
          title: "صفحة لوحة التحكم غير موجودة",
          text: "تعذر العثور على صفحة لوحة التحكم أو الخطة المطلوبة.",
          back: "العودة إلى لوحة التحكم",
          home: "الرئيسية",
        }
      : {
          title: "Dashboard Page Not Found",
          text: "This dashboard page or plan could not be found.",
          back: "Back to Dashboard",
          home: "Go Home",
        };

  return (
    <main className={styles.page} dir={dir}>
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1>{t.title}</h1>
        <p>{t.text}</p>

        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.primaryBtn}>
            {t.back}
          </Link>

          <Link href="/" className={styles.secondaryBtn}>
            {t.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
