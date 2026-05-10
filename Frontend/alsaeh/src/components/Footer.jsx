"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import styles from "./Footer.module.css";

const footerContent = {
  en: {
    brand: "Alsaeh.bh",
    description:
      "A Bahrain tourism planning platform for personalized itineraries, smarter recommendations, and easier trip organization.",
    navigation: "Navigation",
    links: [
      { label: "Home", href: "/" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Create Plan", href: "/dashboard/create-plan" },
      { label: "My Plans", href: "/dashboard" },
      { label: "Settings", href: "/dashboard/settings" },
      { label: "About", href: "/dashboard/about" },
    ],
    project: "University of Bahrain Senior Project",
    contact: "Tourism Recommender System for Bahrain",
    copyright: "2025-2026 Alsaeh.bh. All rights reserved.",
  },
  ar: {
    brand: "السائح.البحرين",
    description:
      "منصة لتخطيط السياحة في البحرين تساعدك على إنشاء جداول مخصصة وتوصيات أذكى وتنظيم أسهل للرحلات.",
    navigation: "التنقل",
    links: [
      { label: "الرئيسية", href: "/" },
      { label: "لوحة التحكم", href: "/dashboard" },
      { label: "إنشاء خطة", href: "/dashboard/create-plan" },
      { label: "خططي", href: "/dashboard" },
      { label: "الإعدادات", href: "/dashboard/settings" },
      { label: "حول", href: "/dashboard/about" },
    ],
    project: "مشروع تخرج جامعة البحرين",
    contact: "نظام توصية سياحي للبحرين",
    copyright: "2025-2026 السائح.البحرين. جميع الحقوق محفوظة.",
  },
};

export default function Footer() {
  const { lang, dir } = useLanguage();
  const t = footerContent[lang] || footerContent.en;

  return (
    <footer className={styles.footer} dir={dir}>
      <div className={styles.inner}>
        <section className={styles.brandSection} aria-label={t.brand}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoMark} aria-hidden />
            <span>{t.brand}</span>
          </Link>
          <p>{t.description}</p>
        </section>

        <nav className={styles.nav} aria-label={t.navigation}>
          <h2>{t.navigation}</h2>
          <div className={styles.linkGrid}>
            {t.links.map((link) => (
              <Link key={`${link.label}-${link.href}`} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <section className={styles.project}>
          <p>{t.project}</p>
          <span>{t.contact}</span>
        </section>
      </div>

      <div className={styles.bottom}>
        <p>{t.copyright}</p>
      </div>
    </footer>
  );
}
