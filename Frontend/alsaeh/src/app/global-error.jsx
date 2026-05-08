"use client";

import Link from "next/link";
import "./globals.css";
import styles from "./error-pages.module.css";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <main className={styles.page}>
          <div className={styles.card}>
            <span className={styles.code}>500</span>
            <h1>Application Error</h1>
            <p>
              A serious error occurred while loading the application.
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
      </body>
    </html>
  );
}