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
      let nextPath = "/dashboard";
      let callbackType = "";

      try {
        const callbackUrl = new URL(window.location.href);
        const hashParams = new URLSearchParams(callbackUrl.hash.replace(/^#/, ""));
        const errorDescription =
          callbackUrl.searchParams.get("error_description") ||
          hashParams.get("error_description");

        nextPath = callbackUrl.searchParams.get("next") || "/dashboard";
        callbackType = callbackUrl.searchParams.get("type") || hashParams.get("type") || "";

        if (!nextPath.startsWith("/")) {
          nextPath = "/dashboard";
        }

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        const hasCode = callbackUrl.searchParams.has("code");
        let session = null;

        if (hasCode) {
          const { data } = await supabase.auth.exchangeCodeForSession(window.location.href);
          session = data.session;
        }

        if (!session) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
        }

        if (session) {
          sessionStorage.removeItem("settings_profile");
          sessionStorage.removeItem("auth_user");

          if (callbackType === "email_change") {
            router.replace("/dashboard/settings?email_change=success");
            return;
          }

          router.replace(nextPath);
          return;
        }
      } catch (error) {
        console.error("Auth callback error:", error);

        if (callbackType === "email_change") {
          const message = encodeURIComponent(
            error?.message || "Email change confirmation failed."
          );
          router.replace(`/dashboard/settings?email_change=error&message=${message}`);
          return;
        }
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
