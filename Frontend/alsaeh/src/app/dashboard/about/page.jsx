"use client";

import styles from "../dashboard.module.css";

const objectives = [
  {
    title: "Analyze user preferences",
    text: "Collect interests, budget, trip duration, travel style, people count, and constraints before generating a plan.",
  },
  {
    title: "Generate AI-powered plans",
    text: "Use Gemini to produce personalized Bahrain itineraries with realistic activities and day-by-day structure.",
  },
  {
    title: "Recommend real places",
    text: "Suggest Bahrain attractions, restaurants, cafes, malls, museums, beaches, and activities with exact place names.",
  },
  {
    title: "Support plan refinement",
    text: "Let users edit plan details manually and refine itineraries through a conversational assistant.",
  },
];

const stack = [
  ["Frontend", "Next.js"],
  ["Backend", "FastAPI"],
  ["Database", "Supabase PostgreSQL"],
  ["Auth", "Supabase Auth"],
  ["AI", "Gemini API"],
];

const team = [
  { initials: "AO", name: "Ammar Osama Ali", id: "202206744" },
  { initials: "AT", name: "Ahmed Taha", id: "202203742" },
  { initials: "HA", name: "Hashem Ahmed", id: "202204853" },
];

export default function DashboardAboutPage() {
  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.createBadge}>About Alsaeh.bh</span>
          <h1 className={styles.pageTitle}>Tourism Recommender System for Bahrain</h1>
          <p className={styles.pageSubtitle}>
            A University of Bahrain senior project that uses AI to create
            personalized Bahrain tourism plans from each traveler&apos;s budget,
            interests, time, and travel style.
          </p>
        </div>
      </div>

      <section className={styles.aboutDashboardHero}>
        <div className={styles.detailsCard}>
          <h2 className={styles.blockTitle}>Project Context</h2>
          <p className={styles.settingsText}>
            Tourists visiting Bahrain often receive generic recommendations that
            do not account for budget, trip duration, preferred activities, or
            constraints. Alsaeh.bh solves this by collecting preferences and
            generating structured day-by-day plans that can be saved, edited,
            exported, and refined through a chatbot.
          </p>
        </div>

        <div className={`${styles.detailsCard} ${styles.aboutVisualCard}`}>
          <span>Personalized itinerary</span>
          <strong>Discover Bahrain, your way.</strong>
          <div className={styles.aboutVisualList}>
            <p>Bahrain Fort</p>
            <p>Al-Fatih Mosque</p>
            <p>The Avenues Bahrain</p>
          </div>
        </div>
      </section>

      <section className={styles.aboutInfoGrid}>
        <article className={styles.detailsCard}>
          <h2 className={styles.blockTitle}>The Problem</h2>
          <p className={styles.settingsText}>
            Existing tourism platforms can be time-consuming because users must
            compare places manually and adapt generic suggestions to their real
            travel needs.
          </p>
        </article>

        <article className={styles.detailsCard}>
          <h2 className={styles.blockTitle}>The Solution</h2>
          <p className={styles.settingsText}>
            The system uses Gemini to generate realistic Bahrain-only itineraries
            with exact place names, estimated costs, location areas, notes, and
            Google Maps links.
          </p>
        </article>
      </section>

      <section className={styles.detailsCard}>
        <div className={styles.settingsSectionHeader}>
          <span className={styles.settingsSectionIcon}>O</span>
          <div>
            <h2>Project Objectives</h2>
            <p>Core goals that shaped the system design and implementation.</p>
          </div>
        </div>

        <div className={styles.aboutObjectiveGrid}>
          {objectives.map((objective, index) => (
            <article key={objective.title} className={styles.aboutObjectiveCard}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{objective.title}</h3>
              <p>{objective.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.aboutInfoGrid}>
        <article className={styles.detailsCard}>
          <h2 className={styles.blockTitle}>Technology Stack</h2>
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
          <h2 className={styles.blockTitle}>Architecture</h2>
          <div className={styles.aboutArchitecture}>
            <span>User Browser</span>
            <span>Next.js Frontend</span>
            <span>FastAPI Backend</span>
            <span>Supabase PostgreSQL, Supabase Auth, Gemini API</span>
          </div>
        </article>
      </section>

      <section className={styles.detailsCard}>
        <div className={styles.settingsSectionHeader}>
          <span className={styles.settingsSectionIcon}>T</span>
          <div>
            <h2>The Team</h2>
            <p>
              Designed and developed by Computer Science students at the
              University of Bahrain.
            </p>
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
            <span>Project Supervisor</span>
            <strong>Dr. Amal Ghanim</strong>
            <p>College of Information Technology, University of Bahrain</p>
          </div>
          <div>
            <span>Academic Context</span>
            <strong>ITSE498 and ITCC498 Senior Project</strong>
            <p>Academic Year 2025-2026, Semester 2</p>
          </div>
        </div>
      </section>
    </div>
  );
}
