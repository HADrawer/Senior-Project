"use client";

import { useEffect, useState } from "react";
import styles from "../dashboard.module.css";

export default function SettingsPage() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");
    if (savedLang === "ar" || savedLang === "en") {
      setLang(savedLang);
    }
  }, []);

  const content = {
    en: {
      title: "Settings",
      subtitle: "This page will contain user settings later.",
    },
    ar: {
      title: "الإعدادات",
      subtitle: "هذه الصفحة ستحتوي على إعدادات المستخدم لاحقًا.",
    },
  };

  const t = content[lang];

  return (
    <div className={styles.pageContent}>
      <h1 className={styles.pageTitle}>{t.title}</h1>
      <p className={styles.pageSubtitle}>{t.subtitle}</p>
    </div>
  );
}