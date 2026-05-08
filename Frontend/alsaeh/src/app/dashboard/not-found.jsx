import Link from "next/link";
import styles from "../error-pages.module.css";

export default function DashboardNotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1>Dashboard Page Not Found</h1>
        <p>
          This dashboard page or plan could not be found.
        </p>

        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.primaryBtn}>
            Back to Dashboard
          </Link>

          <Link href="/" className={styles.secondaryBtn}>
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}