"use client";

import Link from "next/link";
import "./globals.css";
import styles from "./error-pages.module.css";
import { useLanguage } from "@/lib/i18n";

export default function GlobalError({ reset }) {
  const { lang, dir } = useLanguage();
  const t =
    lang === "ar"
      ? {
          title: "خطأ في التطبيق",
          text: "حدث خطأ خطير أثناء تحميل التطبيق.",
          retry: "حاول مرة أخرى",
          home: "الرئيسية",
        }
      : {
          title: "Application Error",
          text: "A serious error occurred while loading the application.",
          retry: "Try Again",
          home: "Go Home",
        };

  return (
    <html lang={lang} dir={dir}>
      <body>
        <main className={styles.page}>
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
      </body>
    </html>
  );
}
