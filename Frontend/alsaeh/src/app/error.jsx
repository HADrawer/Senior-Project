"use client";

import Link from "next/link";
import styles from "./error-pages.module.css";

export default function Error({ error, reset }) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.code}>500</span>
        <h1>Something Went Wrong</h1>
        <p>
          An unexpected error happened. Please try again or return to the home page.
        </p>

        <div className={styles.actions}>
          <button onClick={reset} className={styles.primaryBtn}>
            Try Again
          </button>
          <Link href="/" className={styles.secondaryBtn}>
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}