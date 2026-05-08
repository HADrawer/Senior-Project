import Link from "next/link";
import styles from "./error-pages.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1>Page Not Found</h1>
        <p>
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            Go Home
          </Link>
          <Link href="/dashboard" className={styles.secondaryBtn}>
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}