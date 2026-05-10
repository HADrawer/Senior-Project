"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import styles from "../../login/auth.module.css";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { lang, dir } = useLanguage();

  const text =
    lang === "ar"
      ? "جاري إكمال تسجيل الدخول..."
      : "Completing sign in...";

  useEffect(() => {
    async function finishAuth() {
      try {
        const hasCode =
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).has("code");

        if (hasCode) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }

        const { data } = await supabase.auth.getSession();

        if (data.session) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Auth callback error:", error);
      }

      router.replace("/login");
    }

    finishAuth();
  }, [router]);

  return (
    <main className={styles.pageLoading} dir={dir}>
      {text}
    </main>
  );
}
