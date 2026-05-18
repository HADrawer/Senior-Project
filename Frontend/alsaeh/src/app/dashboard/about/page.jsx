"use client";


import styles from "../dashboard.module.css";
import { useLanguage } from "@/lib/i18n";

const team = [
  { initials: "AO", name: "Ammar Osama Ali", id: "202206744" },
  { initials: "AT", name: "Ahmed Taha", id: "202203742" },
  { initials: "HA", name: "Hashem Ahmed", id: "202204853" },
];

export default function DashboardAboutPage() {
  const { lang, dir } = useLanguage();

  const t = {
    en: {
      badge: "About Alsaeh.bh",
      title: "Tourism Recommender System for Bahrain",
      subtitle:
        "A University of Bahrain senior project that uses AI to create personalized Bahrain tourism plans from each traveler's budget, interests, time, and travel style.",
      contextTitle: "Project Context",
      context:
        "Tourists visiting Bahrain often receive generic recommendations that do not account for budget, trip duration, preferred activities, or constraints. Alsaeh.bh solves this by collecting preferences and generating structured day-by-day plans that can be saved, edited, exported, and refined through a chatbot.",
      itinerary: "Personalized itinerary",
      discover: "Discover Bahrain, your way.",
      problemTitle: "The Problem",
      problem:
        "Existing tourism platforms can be time-consuming because users must compare places manually and adapt generic suggestions to their real travel needs.",
      solutionTitle: "The Solution",
      solution:
        "The system uses Gemini to generate realistic Bahrain-only itineraries with exact place names, estimated costs, location areas, notes, and Google Maps links.",
      objectivesTitle: "Project Objectives",
      objectivesSubtitle: "Core goals that shaped the system design and implementation.",
      objectives: [
        ["Analyze user preferences", "Collect interests, budget, trip duration, travel style, people count, and constraints before generating a plan."],
        ["Generate AI-powered plans", "Use Gemini to produce personalized Bahrain itineraries with realistic activities and day-by-day structure."],
        ["Recommend real places", "Suggest Bahrain attractions, restaurants, cafes, malls, museums, beaches, and activities with exact place names."],
        ["Support plan refinement", "Let users edit plan details manually and refine itineraries through a conversational assistant."],
      ],
      stackTitle: "Technology Stack",
      architectureTitle: "Architecture",
      browser: "User Browser",
      frontend: "Next.js Frontend",
      backend: "FastAPI Backend",
      services: "Supabase PostgreSQL, Supabase Auth, Gemini API",
      teamTitle: "The Team",
      teamSubtitle:
        "Designed and developed by Computer Science students at the University of Bahrain.",
      supervisor: "Project Supervisor",
      college: "College of Information Technology, University of Bahrain",
      academicContext: "Academic Context",
      course: "ITSE498 and ITCC498 Senior Project",
      year: "Academic Year 2025-2026, Semester 2",
    },
    ar: {
      badge: "حول السائح.البحرين",
      title: "نظام توصية سياحي للبحرين",
      subtitle:
        "مشروع تخرج في جامعة البحرين يستخدم الذكاء الاصطناعي لإنشاء خطط سياحية مخصصة حسب الميزانية والاهتمامات والوقت ونمط السفر.",
      contextTitle: "سياق المشروع",
      context:
        "غالباً ما يحصل زوار البحرين على توصيات عامة لا تراعي الميزانية أو مدة الرحلة أو الأنشطة المفضلة أو القيود. يعالج السائح.البحرين ذلك بجمع التفضيلات وإنشاء خطط يومية منظمة يمكن حفظها وتعديلها وتصديرها وتحسينها عبر المحادثة.",
      itinerary: "جدول مخصص",
      discover: "اكتشف البحرين بطريقتك.",
      problemTitle: "المشكلة",
      problem:
        "قد تكون منصات السياحة الحالية مستهلكة للوقت لأن المستخدمين يقارنون الأماكن يدوياً ويعدلون الاقتراحات العامة لتناسب احتياجاتهم الفعلية.",
      solutionTitle: "الحل",
      solution:
        "يستخدم النظام Gemini لإنشاء جداول واقعية مخصصة للبحرين مع أسماء أماكن دقيقة وتكاليف تقديرية ومناطق وملاحظات وروابط خرائط Google.",
      objectivesTitle: "أهداف المشروع",
      objectivesSubtitle: "الأهداف الأساسية التي شكلت تصميم النظام وتنفيذه.",
      objectives: [
        ["تحليل تفضيلات المستخدم", "جمع الاهتمامات والميزانية ومدة الرحلة ونمط السفر وعدد الأشخاص والقيود قبل إنشاء الخطة."],
        ["إنشاء خطط بالذكاء الاصطناعي", "استخدام Gemini لإنتاج جداول سياحية مخصصة للبحرين ببنية يومية وأنشطة واقعية."],
        ["اقتراح أماكن حقيقية", "اقتراح معالم ومطاعم ومقاهٍ ومجمعات ومتاحف وشواطئ وأنشطة في البحرين بأسماء دقيقة."],
        ["دعم تحسين الخطة", "تمكين المستخدم من تعديل تفاصيل الخطة يدوياً وتحسين الجداول عبر مساعد محادثة."],
      ],
      stackTitle: "التقنيات المستخدمة",
      architectureTitle: "البنية",
      browser: "متصفح المستخدم",
      frontend: "واجهة Next.js",
      backend: "خلفية FastAPI",
      services: "Supabase PostgreSQL و Supabase Auth و Gemini API",
      teamTitle: "الفريق",
      teamSubtitle: "صممه وطورّه طلبة علوم الحاسوب في جامعة البحرين.",
      supervisor: "مشرفة المشروع",
      college: "كلية تقنية المعلومات، جامعة البحرين",
      academicContext: "السياق الأكاديمي",
      course: "مشروع تخرج ITSE498 و ITCC498",
      year: "العام الأكاديمي 2025-2026، الفصل الثاني",
    },
  }[lang];

  const stack = [
    ["Frontend", "Next.js"],
    ["Backend", "FastAPI"],
    ["Database", "Supabase PostgreSQL"],
    ["Auth", "Supabase Auth"],
    ["AI", "Gemini API"],
  ];

  return (
    <div className={styles.pageContent} dir={dir}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.createBadge}>{t.badge}</span>
          <h1 className={styles.pageTitle}>{t.title}</h1>
          <p className={styles.pageSubtitle}>{t.subtitle}</p>
        </div>
      </div>

      <section className={styles.aboutDashboardHero}>
        <div className={styles.detailsCard}>
          <h2 className={styles.blockTitle}>{t.contextTitle}</h2>
          <p className={styles.settingsText}>{t.context}</p>
        </div>

        <div className={`${styles.detailsCard} ${styles.aboutVisualCard}`}>
          <span>{t.itinerary}</span>
          <strong>{t.discover}</strong>
          <div className={styles.aboutVisualList}>
            <p>Bahrain Fort</p>
            <p>Al-Fatih Mosque</p>
            <p>The Avenues Bahrain</p>
          </div>
        </div>
      </section>

      <section className={styles.aboutInfoGrid}>
        <article className={styles.detailsCard}>
          <h2 className={styles.blockTitle}>{t.problemTitle}</h2>
          <p className={styles.settingsText}>{t.problem}</p>
        </article>

        <article className={styles.detailsCard}>
          <h2 className={styles.blockTitle}>{t.solutionTitle}</h2>
          <p className={styles.settingsText}>{t.solution}</p>
        </article>
      </section>

      <section className={styles.detailsCard}>
        <div className={styles.settingsSectionHeader}>
          <span className={styles.settingsSectionIcon}>O</span>
          <div>
            <h2>{t.objectivesTitle}</h2>
            <p>{t.objectivesSubtitle}</p>
          </div>
        </div>

        <div className={styles.aboutObjectiveGrid}>
          {t.objectives.map(([title, text], index) => (
            <article key={title} className={styles.aboutObjectiveCard}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.aboutInfoGrid}>
        <article className={styles.detailsCard}>
          <h2 className={styles.blockTitle}>{t.stackTitle}</h2>
          <div className={styles.aboutStackGrid}>
            {stack.map(([role, name]) => (
              <div key={role} className={styles.aboutStackItem}>
                <span>{role}</span>
                <strong>{name}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.detailsCard}>
          <h2 className={styles.blockTitle}>{t.architectureTitle}</h2>
          <div className={styles.aboutArchitecture}>
            <span>{t.browser}</span>
            <span>{t.frontend}</span>
            <span>{t.backend}</span>
            <span>{t.services}</span>
          </div>
        </article>
      </section>

      <section className={styles.detailsCard}>
        <div className={styles.settingsSectionHeader}>
          <span className={styles.settingsSectionIcon}>T</span>
          <div>
            <h2>{t.teamTitle}</h2>
            <p>{t.teamSubtitle}</p>
          </div>
        </div>

        <div className={styles.aboutTeamGrid}>
          {team.map((member) => (
            <article key={member.id} className={styles.aboutTeamCard}>
              <div className={styles.aboutAvatar}>{member.initials}</div>
              <h3>{member.name}</h3>
              <span>{member.id}</span>
            </article>
          ))}
        </div>

        <div className={styles.aboutSupervisor}>
          <div>
            <span>{t.supervisor}</span>
            <strong>Dr. Amal Ghanim</strong>
            <p>{t.college}</p>
          </div>
          <div>
            <span>{t.academicContext}</span>
            <strong>{t.course}</strong>
            <p>{t.year}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
