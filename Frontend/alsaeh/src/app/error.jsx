"use client";

import Link from "next/link";
import styles from "./error-pages.module.css";
import { useLanguage } from "@/lib/i18n";

export default function Error({ reset }) {
  const { lang, dir } = useLanguage();
  const t =
    lang === "ar"
      ? {
          title: "حدث خطأ",
          text: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو العودة إلى الصفحة الرئيسية.",
          retry: "حاول مرة أخرى",
          home: "الرئيسية",
        }
      : {
          title: "Something Went Wrong",
          text: "An unexpected error happened. Please try again or return to the home page.",
          retry: "Try Again",
          home: "Go Home",
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
          <Link href="/" className={styles.secondaryBtn}>
            {t.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
