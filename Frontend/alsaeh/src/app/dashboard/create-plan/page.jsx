"use client";

import { useEffect, useState } from "react";
import styles from "../dashboard.module.css";

export default function CreatePlanPage() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");
    if (savedLang === "ar" || savedLang === "en") {
      setLang(savedLang);
    }
  }, []);

  const content = {
    en: {
      title: "Create Plan",
      subtitle: "This page will be used to create a new tourism plan.",
    },
    ar: {
      title: "إنشاء خطة",
      subtitle: "هذه الصفحة ستستخدم لإنشاء خطة سياحية جديدة.",
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