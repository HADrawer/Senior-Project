"use client";

import Link from "next/link";
import styles from "./error-pages.module.css";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { lang, dir } = useLanguage();
  const t =
    lang === "ar"
      ? {
          title: "الصفحة غير موجودة",
          text: "الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.",
          home: "الرئيسية",
          dashboard: "لوحة التحكم",
        }
      : {
          title: "Page Not Found",
          text: "The page you are looking for does not exist or may have been moved.",
          home: "Go Home",
          dashboard: "Dashboard",
        };

  return (
    <main className={styles.page} dir={dir}>
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1>{t.title}</h1>
        <p>{t.text}</p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            {t.home}
          </Link>
          <Link href="/dashboard" className={styles.secondaryBtn}>
            {t.dashboard}
          </Link>
        </div>
      </div>
    </main>
  );
}
