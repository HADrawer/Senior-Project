"use client";

import Link from "next/link";
import styles from "../error-pages.module.css";

export default function DashboardError({ error, reset }) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.code}>500</span>
        <h1>Dashboard Error</h1>
        <p>
          Something went wrong while loading the dashboard. Please try again.
        </p>

        <div className={styles.actions}>
          <button onClick={reset} className={styles.primaryBtn}>
            Try Again
          </button>

          <Link href="/dashboard" className={styles.secondaryBtn}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}