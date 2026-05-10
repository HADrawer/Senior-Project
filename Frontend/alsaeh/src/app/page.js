"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  const [lang, setLang] = useState("en");

  const content = {
    en: {
      brand: "Alsaeh.bh",
      heroLabel: "Bahrain Tourism AI",
      heroTitle: "Discover Bahrain, Your Way",
      heroText:
        "A smart tourism platform crafted for Bahrain. Get personalized AI-generated travel plans based on your interests, budget, and time — and refine them with a conversational assistant.",
      getStarted: "Start Planning",
      login: "Sign In",
      register: "Create Account",
      featuresTitle: "Why Alsaeh.bh?",
      featureSubtitle: "Everything you need to explore Bahrain intelligently",
      features: [
        {
          icon: "✦",
          title: "Personalized Plans",
          text: "AI-crafted day-by-day itineraries tailored to your interests, budget, travel style, and constraints.",
        },
        {
          icon: "◈",
          title: "Conversational Editing",
          text: "Refine your plans in real time through a built-in AI chatbot — no manual work required.",
        },
        {
          icon: "⬡",
          title: "Bahrain-First",
          text: "Every recommendation is specific to Bahrain — real places, exact locations, Google Maps links.",
        },
      ],
      aboutTitle: "Built for Real Travelers",
      aboutText:
        "Alsaeh.bh combines modern web technologies with Gemini AI to help tourists and locals plan richer, more organized trips across Bahrain — from heritage sites and beaches to local cafes and malls.",
      exploreTitle: "All of Bahrain, Organized",
      exploreText:
        "From the historic Bahrain Fort and Al-Fatih Mosque to Amwaj Islands and Seef Mall — find attractions, restaurants, activities, and experiences matched to your style.",
      footer: "© 2025–2026 Alsaeh.bh — University of Bahrain Senior Project",
      langSwitch: "العربية",
      statsPlans: "Plans Generated",
      statsPlaces: "Bahrain Locations",
      statsRating: "User Satisfaction",
    },
    ar: {
      brand: "السائح.البحرين",
      heroLabel: "ذكاء اصطناعي للسياحة في البحرين",
      heroTitle: "اكتشف البحرين بطريقتك",
      heroText:
        "منصة سياحية ذكية مصممة للبحرين. احصل على خطط سياحية مخصصة بالذكاء الاصطناعي حسب اهتماماتك وميزانيتك ووقتك — وعدّلها بمساعد محادثة تفاعلي.",
      getStarted: "ابدأ التخطيط",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      featuresTitle: "لماذا السائح.البحرين؟",
      featureSubtitle: "كل ما تحتاجه لاستكشاف البحرين بذكاء",
      features: [
        {
          icon: "✦",
          title: "خطط مخصصة",
          text: "جداول سياحية يومية مُصممة بالذكاء الاصطناعي حسب اهتماماتك وميزانيتك وأسلوب سفرك.",
        },
        {
          icon: "◈",
          title: "تعديل بالمحادثة",
          text: "عدّل خططك في الوقت الفعلي من خلال مساعد محادثة ذكي مدمج — بدون أي جهد يدوي.",
        },
        {
          icon: "⬡",
          title: "تخصص البحرين",
          text: "كل توصية خاصة بالبحرين — أماكن حقيقية، مواقع دقيقة، روابط Google Maps.",
        },
      ],
      aboutTitle: "مصنوع للمسافرين الحقيقيين",
      aboutText:
        "يجمع السائح.البحرين تقنيات الويب الحديثة مع Gemini AI لمساعدة السياح والمقيمين على تخطيط رحلات أكثر ثراءً وتنظيماً في البحرين.",
      exploreTitle: "كل البحرين، منظمة",
      exploreText:
        "من قلعة البحرين التاريخية ومسجد الفاتح إلى جزر أمواج وسيف مول — اعثر على المعالم والمطاعم والأنشطة المناسبة لأسلوبك.",
      footer: "© 2025–2026 السائح.البحرين — مشروع تخرج جامعة البحرين",
      langSwitch: "English",
      statsPlans: "خطة مولّدة",
      statsPlaces: "موقع بحريني",
      statsRating: "رضا المستخدمين",
    },
  };

  const t = content[lang];
  const isAr = lang === "ar";

  return (
    <main className={styles.page} dir={isAr ? "rtl" : "ltr"}>
      {/* Background decoration */}
      <div className={styles.bgOrb1} aria-hidden />
      <div className={styles.bgOrb2} aria-hidden />

      {/* ── Navigation ──────────────────────────────────────── */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark} />
            <span className={styles.logoText}>{t.brand}</span>
          </div>

          <nav className={styles.navLinks}>
            <button
              className={styles.langBtn}
              onClick={() => setLang(isAr ? "en" : "ar")}
              aria-label="Switch language"
            >
              {t.langSwitch}
            </button>
            <Link href="/login" className={styles.navLogin}>
              {t.login}
            </Link>
            <Link href="/register" className={styles.navRegister}>
              {t.register}
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>{t.heroLabel}</span>
          <h1 className={styles.heroTitle}>{t.heroTitle}</h1>
          <p className={styles.heroText}>{t.heroText}</p>
          <div className={styles.heroCta}>
            <Link href="/register" className={styles.ctaPrimary}>
              {t.getStarted}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/login" className={styles.ctaSecondary}>
              {t.login}
            </Link>
          </div>

          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <strong>500+</strong>
              <span>{t.statsPlans}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <strong>200+</strong>
              <span>{t.statsPlaces}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <strong>98%</strong>
              <span>{t.statsRating}</span>
            </div>
          </div>
        </div>

        {/* Hero visual */}
        <div className={styles.heroVisual} aria-hidden>
          <div className={styles.visualCard}>
            <div className={styles.visualCardHeader}>
              <div className={styles.visualDot} style={{ background: "#F04060" }} />
              <div className={styles.visualDot} style={{ background: "#F0A020" }} />
              <div className={styles.visualDot} style={{ background: "#20C040" }} />
            </div>
            <div className={styles.visualBody}>
              <div className={styles.visualPill}>🌟 Personalized for you</div>
              <div className={styles.visualLine} style={{ width: "90%" }} />
              <div className={styles.visualLine} style={{ width: "70%" }} />
              <div className={styles.visualActivities}>
                {["🏖️ Al Zallaq Beach", "🕌 Al-Fatih Mosque", "🍽️ Haji's Restaurant", "🛍️ City Centre Mall"].map((item, i) => (
                  <div key={i} className={styles.visualActivity}>
                    <span>{item}</span>
                    <div className={styles.visualBadge}>✓</div>
                  </div>
                ))}
              </div>
              <div className={styles.visualMapBtn}>📍 Open in Google Maps</div>
            </div>
          </div>
          <div className={styles.visualFloatA} />
          <div className={styles.visualFloatB} />
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.featuresTitle}>{t.featuresTitle}</h2>
            <p className={styles.featuresSubtitle}>{t.featureSubtitle}</p>
          </div>
          <div className={styles.featureGrid}>
            {t.features.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureCardTitle}>{f.title}</h3>
                <p className={styles.featureCardText}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────── */}
      <section className={styles.about}>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutCard}>
            <h3 className={styles.aboutCardTitle}>{t.aboutTitle}</h3>
            <p className={styles.aboutCardText}>{t.aboutText}</p>
          </div>
          <div className={styles.aboutCard}>
            <h3 className={styles.aboutCardTitle}>{t.exploreTitle}</h3>
            <p className={styles.aboutCardText}>{t.exploreText}</p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <p>{t.footer}</p>
      </footer>
    </main>
  );
}