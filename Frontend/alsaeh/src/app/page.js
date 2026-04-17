"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  const [lang, setLang] = useState("en");

  const content = {
    en: {
      brand: "Alsaeh.bh",
      heroTitle: "Discover Bahrain Your Way",
      heroText:
        "A smart tourism platform that helps you explore Bahrain with personalized recommendations and AI-generated travel plans based on your interests, budget, and time.",
      getStarted: "Get Started",
      login: "Login",
      register: "Register",
      featuresTitle: "Why Alsaeh.bh?",
      feature1Title: "Personalized Plans",
      feature1Text:
        "Create travel plans based on your preferences, interests, and available days.",
      feature2Title: "AI Assistance",
      feature2Text:
        "Get smart suggestions for places, restaurants, cafes, and activities in Bahrain.",
      feature3Title: "Easy Planning",
      feature3Text:
        "Organize your trip in a simple and modern way through one platform.",
      aboutTitle: "About the Platform",
      aboutText:
        "Alsaeh.bh is designed to make tourism in Bahrain easier and more enjoyable. It combines modern web technologies with AI to help users discover places and build better travel experiences.",
      exploreTitle: "Experience Bahrain",
      exploreText:
        "From heritage sites and museums to beaches, cafes, and local attractions, Alsaeh.bh helps you find what matches your style.",
      footer: "Alsaeh.bh | Tourism Recommender System for Bahrain",
      switchLabel: "العربية",
    },
    ar: {
      brand: "السائح.البحرين",
      heroTitle: "اكتشف البحرين بطريقتك",
      heroText:
        "منصة سياحية ذكية تساعدك على استكشاف البحرين من خلال توصيات مخصصة وخطط سياحية مولدة بالذكاء الاصطناعي حسب اهتماماتك وميزانيتك ووقتك.",
      getStarted: "ابدأ الآن",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      featuresTitle: "لماذا السائح.البحرين؟",
      feature1Title: "خطط مخصصة",
      feature1Text:
        "أنشئ خططًا سياحية حسب تفضيلاتك واهتماماتك وعدد الأيام المتاحة لك.",
      feature2Title: "مساعدة ذكية",
      feature2Text:
        "احصل على اقتراحات ذكية للأماكن والمطاعم والمقاهي والأنشطة في البحرين.",
      feature3Title: "تخطيط سهل",
      feature3Text:
        "نظم رحلتك بطريقة بسيطة وحديثة من خلال منصة واحدة.",
      aboutTitle: "عن المنصة",
      aboutText:
        "تم تصميم السائح.البحرين لتسهيل السياحة في البحرين وجعلها أكثر متعة. تجمع المنصة بين تقنيات الويب الحديثة والذكاء الاصطناعي لمساعدة المستخدمين على اكتشاف الأماكن وبناء تجارب سفر أفضل.",
      exploreTitle: "عِش تجربة البحرين",
      exploreText:
        "من المواقع التراثية والمتاحف إلى الشواطئ والمقاهي والمعالم المحلية، تساعدك المنصة في العثور على ما يناسب أسلوبك.",
      footer: "السائح.البحرين | نظام توصية سياحي للبحرين",
      switchLabel: "English",
    },
  };

  const t = content[lang];

  return (
    <main
      className={styles.page}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <header className={styles.navbar}>
        <div className={styles.logoSection}>
          <div className={styles.logoMark}></div>
          <h1 className={styles.logoText}>{t.brand}</h1>
        </div>

        <div className={styles.navActions}>
          <button
            className={styles.langBtn}
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
          >
            {t.switchLabel}
          </button>

          <Link href="/login" className={styles.loginBtn}>
            {t.login}
          </Link>

          <Link href="/register" className={styles.registerBtn}>
            {t.register}
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Bahrain Inspired</span>
          <h2 className={styles.heroTitle}>{t.heroTitle}</h2>
          <p className={styles.heroText}>{t.heroText}</p>

          <div className={styles.heroButtons}>
            <Link href="/register" className={styles.primaryBtn}>
              {t.getStarted}
            </Link>

            <Link href="/login" className={styles.secondaryBtn}>
              {t.login}
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.cardLarge}>
            <div className={styles.cardTop}></div>
            <div className={styles.cardCircle}></div>
            <div className={styles.cardLine}></div>
            <div className={styles.cardLineSmall}></div>
          </div>

          <div className={styles.floatingBoxOne}></div>
          <div className={styles.floatingBoxTwo}></div>
        </div>
      </section>

      <section className={styles.features}>
        <h3 className={styles.sectionTitle}>{t.featuresTitle}</h3>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <h4>{t.feature1Title}</h4>
            <p>{t.feature1Text}</p>
          </div>

          <div className={styles.featureCard}>
            <h4>{t.feature2Title}</h4>
            <p>{t.feature2Text}</p>
          </div>

          <div className={styles.featureCard}>
            <h4>{t.feature3Title}</h4>
            <p>{t.feature3Text}</p>
          </div>
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.aboutCard}>
          <h3>{t.aboutTitle}</h3>
          <p>{t.aboutText}</p>
        </div>

        <div className={styles.aboutCard}>
          <h3>{t.exploreTitle}</h3>
          <p>{t.exploreText}</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>{t.footer}</p>
      </footer>
    </main>
  );
}