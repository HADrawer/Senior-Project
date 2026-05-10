"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { useLanguage } from "@/lib/i18n";

export default function HomePage() {
  const { lang, dir, isAr, toggleLang } = useLanguage();

  const t = {
    en: {
      brand: "Alsaeh.bh",
      heroLabel: "Bahrain Tourism AI",
      heroTitle: "Discover Bahrain, Your Way",
      heroText:
        "A smart tourism platform crafted for Bahrain. Get personalized AI-generated travel plans based on your interests, budget, and time, then refine them with a conversational assistant.",
      getStarted: "Start Planning",
      login: "Sign In",
      register: "Create Account",
      featuresTitle: "Why Alsaeh.bh?",
      featureSubtitle: "Everything you need to explore Bahrain intelligently",
      features: [
        {
          icon: "*",
          title: "Personalized Plans",
          text: "AI-crafted day-by-day itineraries tailored to your interests, budget, travel style, and constraints.",
        },
        {
          icon: "o",
          title: "Conversational Editing",
          text: "Refine your plans in real time through a built-in AI chatbot.",
        },
        {
          icon: "+",
          title: "Bahrain-First",
          text: "Every recommendation is specific to Bahrain: real places, exact locations, and Google Maps links.",
        },
      ],
      aboutTitle: "Built for Real Travelers",
      aboutText:
        "Alsaeh.bh combines modern web technologies with Gemini AI to help tourists and locals plan richer, more organized trips across Bahrain.",
      exploreTitle: "All of Bahrain, Organized",
      exploreText:
        "From Bahrain Fort and Al-Fatih Mosque to Amwaj Islands and Seef Mall, find attractions, restaurants, activities, and experiences matched to your style.",
      langSwitch: "العربية",
      statsPlans: "Plans Generated",
      statsPlaces: "Bahrain Locations",
      statsRating: "User Satisfaction",
      visualPill: "Personalized for you",
      visualMap: "Open in Google Maps",
      switchLanguage: "Switch language",
    },
    ar: {
      brand: "السائح.البحرين",
      heroLabel: "ذكاء اصطناعي للسياحة في البحرين",
      heroTitle: "اكتشف البحرين بطريقتك",
      heroText:
        "منصة سياحية ذكية مصممة للبحرين. احصل على خطط سياحية مخصصة بالذكاء الاصطناعي حسب اهتماماتك وميزانيتك ووقتك، ثم عدلها بمساعد محادثة تفاعلي.",
      getStarted: "ابدأ التخطيط",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      featuresTitle: "لماذا السائح.البحرين؟",
      featureSubtitle: "كل ما تحتاجه لاستكشاف البحرين بذكاء",
      features: [
        {
          icon: "*",
          title: "خطط مخصصة",
          text: "جداول سياحية يومية مصممة حسب اهتماماتك وميزانيتك ونمط سفرك وقيودك.",
        },
        {
          icon: "o",
          title: "تعديل بالمحادثة",
          text: "عدّل خططك في الوقت الفعلي من خلال مساعد محادثة ذكي مدمج.",
        },
        {
          icon: "+",
          title: "مخصص للبحرين",
          text: "كل توصية مرتبطة بالبحرين: أماكن حقيقية ومواقع دقيقة وروابط خرائط Google.",
        },
      ],
      aboutTitle: "مصمم للمسافرين الحقيقيين",
      aboutText:
        "يجمع السائح.البحرين بين تقنيات الويب الحديثة و Gemini AI لمساعدة السياح والمقيمين على تخطيط رحلات أكثر تنظيماً في البحرين.",
      exploreTitle: "كل البحرين، منظمة",
      exploreText:
        "من قلعة البحرين ومسجد الفاتح إلى جزر أمواج وسيف مول، اعثر على المعالم والمطاعم والأنشطة المناسبة لأسلوبك.",
      langSwitch: "English",
      statsPlans: "خطة مولدة",
      statsPlaces: "موقع بحريني",
      statsRating: "رضا المستخدمين",
      visualPill: "مخصص لك",
      visualMap: "فتح في خرائط Google",
      switchLanguage: "تغيير اللغة",
    },
  }[lang];

  const activities = isAr
    ? ["شاطئ الزلاق", "مسجد الفاتح", "مطعم حاجي", "سيتي سنتر البحرين"]
    : ["Al Zallaq Beach", "Al-Fatih Mosque", "Haji's Restaurant", "City Centre Mall"];

  return (
    <main className={styles.page} dir={dir}>
      <div className={styles.bgOrb1} aria-hidden />
      <div className={styles.bgOrb2} aria-hidden />

      <header className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark} />
            <span className={styles.logoText}>{t.brand}</span>
          </div>

          <nav className={styles.navLinks}>
            <button
              className={styles.langBtn}
              onClick={toggleLang}
              aria-label={t.switchLanguage}
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

      <section className={`${styles.hero} ${styles.reveal}`}>
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>{t.heroLabel}</span>
          <h1 className={styles.heroTitle}>{t.heroTitle}</h1>
          <p className={styles.heroText}>{t.heroText}</p>
          <div className={styles.heroCta}>
            <Link href="/register" className={styles.ctaPrimary}>
              {t.getStarted}
              <span aria-hidden>{isAr ? "<" : ">"}</span>
            </Link>
            <Link href="/login" className={styles.ctaSecondary}>
              {t.login}
            </Link>
          </div>

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

        <div className={`${styles.heroVisual} ${styles.revealDelay}`} aria-hidden>
          <div className={styles.visualCard}>
            <div className={styles.visualCardHeader}>
              <div className={styles.visualDot} style={{ background: "#F04060" }} />
              <div className={styles.visualDot} style={{ background: "#F0A020" }} />
              <div className={styles.visualDot} style={{ background: "#20C040" }} />
            </div>
            <div className={styles.visualBody}>
              <div className={styles.visualPill}>{t.visualPill}</div>
              <div className={styles.visualLine} style={{ width: "90%" }} />
              <div className={styles.visualLine} style={{ width: "70%" }} />
              <div className={styles.visualActivities}>
                {activities.map((item) => (
                  <div key={item} className={styles.visualActivity}>
                    <span>{item}</span>
                    <div className={styles.visualBadge}>✓</div>
                  </div>
                ))}
              </div>
              <div className={styles.visualMapBtn}>{t.visualMap}</div>
            </div>
          </div>
          <div className={styles.visualFloatA} />
          <div className={styles.visualFloatB} />
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={`${styles.sectionHead} ${styles.reveal}`}>
            <h2 className={styles.featuresTitle}>{t.featuresTitle}</h2>
            <p className={styles.featuresSubtitle}>{t.featureSubtitle}</p>
          </div>
          <div className={styles.featureGrid}>
            {t.features.map((feature, index) => (
              <div
                key={feature.title}
                className={`${styles.featureCard} ${styles.reveal}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureCardTitle}>{feature.title}</h3>
                <p className={styles.featureCardText}>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.about} ${styles.reveal}`}>
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

    </main>
  );
}
