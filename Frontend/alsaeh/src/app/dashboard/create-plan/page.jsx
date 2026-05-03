"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";

function getErrorMessage(detail, fallback) {
  if (Array.isArray(detail)) return detail[0]?.msg || fallback;
  if (typeof detail === "string") return detail;
  return fallback;
}

export default function CreatePlanPage() {
  const router = useRouter();

  const [lang, setLang] = useState("en");
  const [form, setForm] = useState({
    title: "",
    days: "",
    budget: "",
    interests: "",
    travel_style: "",
    preferences: "",
    constraints: "",
    category: "",
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const content = {
    en: {
      badge: "AI Tourism Planner",
      title: "Create Your Bahrain Plan",
      subtitle:
        "Fill in your preferences and let us to generate a personalized tourism itinerary for Bahrain.",
      planTitle: "Plan Title",
      planTitlePlaceholder: "Relaxed Bahrain Weekend",
      days: "Number of Days",
      daysPlaceholder: "2",
      budget: "Budget in BHD",
      budgetPlaceholder: "35",
      category: "Preferred Category",
      anyCategory: "Any category",
      loadingCategories: "Loading categories...",
      interests: "Interests",
      interestsPlaceholder: "cafes, museum, beach",
      interestsHint: "Separate interests with commas.",
      travelStyle: "Travel Style",
      selectStyle: "Select travel style",
      relaxed: "Relaxed",
      adventure: "Adventure",
      family: "Family-friendly",
      cultural: "Cultural",
      budgetFriendly: "Budget-friendly",
      luxury: "Luxury",
      preferences: "Extra Preferences",
      preferencesPlaceholder:
        "Example: low walking, indoor preferred, suitable for family",
      constraints: "Constraints",
      constraintsPlaceholder:
        "Example: indoor preferred, no expensive restaurants",
      constraintsHint: "Separate constraints with commas.",
      cancel: "Cancel",
      generate: "Generate AI Plan",
      generating: "Generating plan...",
      failed: "Failed to generate plan",
      serverError: "Unable to connect to server",
    },
    ar: {
      badge: "مخطط سياحي بالذكاء الاصطناعي",
      title: "أنشئ خطتك السياحية في البحرين",
      subtitle:
        "أدخل تفضيلاتك وسنقوم بإنشاء خطة سياحية مخصصة داخل البحرين.",
      planTitle: "عنوان الخطة",
      planTitlePlaceholder: "عطلة هادئة في البحرين",
      days: "عدد الأيام",
      daysPlaceholder: "2",
      budget: "الميزانية بالدينار البحريني",
      budgetPlaceholder: "35",
      category: "التصنيف المفضل",
      anyCategory: "أي تصنيف",
      loadingCategories: "جاري تحميل التصنيفات...",
      interests: "الاهتمامات",
      interestsPlaceholder: "مقاهي، متحف، شاطئ",
      interestsHint: "افصل بين الاهتمامات باستخدام الفواصل.",
      travelStyle: "نمط الرحلة",
      selectStyle: "اختر نمط الرحلة",
      relaxed: "هادئة",
      adventure: "مغامرة",
      family: "مناسبة للعائلة",
      cultural: "ثقافية",
      budgetFriendly: "اقتصادية",
      luxury: "فاخرة",
      preferences: "تفضيلات إضافية",
      preferencesPlaceholder:
        "مثال: مشي قليل، أماكن داخلية، مناسبة للعائلة",
      constraints: "القيود",
      constraintsPlaceholder:
        "مثال: أماكن داخلية، بدون مطاعم غالية",
      constraintsHint: "افصل بين القيود باستخدام الفواصل.",
      cancel: "إلغاء",
      generate: "إنشاء الخطة بالذكاء الاصطناعي",
      generating: "جاري إنشاء الخطة...",
      failed: "فشل إنشاء الخطة",
      serverError: "تعذر الاتصال بالخادم",
    },
  };

  const t = content[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("site_lang");
    if (savedLang === "ar" || savedLang === "en") {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/place-categories`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Load categories error:", error);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGenerating(true);

    try {
      const interestsList = form.interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const constraintsList = form.constraints
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const finalPreferences = [
        form.preferences,
        form.category ? `Preferred category: ${form.category}` : "",
      ]
        .filter(Boolean)
        .join(". ");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          days: Number(form.days),
          budget: form.budget ? Number(form.budget) : null,
          interests: interestsList,
          travel_style: form.travel_style || null,
          preferences: finalPreferences || null,
          constraints: constraintsList,
          language: "auto",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(data.detail, t.failed));
        setGenerating(false);
        return;
      }

      router.push(`/dashboard/plans/${data.plan_id}`);
    } catch (error) {
      console.error("Generate plan error:", error);
      setError(t.serverError);
      setGenerating(false);
    }
  }

  return (
    <div className={styles.pageContent} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className={styles.createHeader}>
        <span className={styles.createBadge}>{t.badge}</span>
        <h1 className={styles.pageTitle}>{t.title}</h1>
        <p className={styles.pageSubtitle}>{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.aiCreateCard}>
        <div className={styles.aiFormGrid}>
          <div className={styles.aiField}>
            <label>{t.planTitle}</label>
            <input
              value={form.title}
              placeholder={t.planTitlePlaceholder}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className={styles.aiField}>
            <label>{t.days}</label>
            <input
              type="number"
              min="1"
              max="14"
              value={form.days}
              placeholder={t.daysPlaceholder}
              onChange={(e) => setForm({ ...form, days: e.target.value })}
              required
            />
          </div>

          <div className={styles.aiField}>
            <label>{t.budget}</label>
            <input
              type="number"
              min="0"
              value={form.budget}
              placeholder={t.budgetPlaceholder}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </div>

          <div className={styles.aiField}>
            <label>{t.category}</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">
                {loadingCategories ? t.loadingCategories : t.anyCategory}
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.aiField}>
          <label>{t.interests}</label>
          <input
            value={form.interests}
            placeholder={t.interestsPlaceholder}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
            required
          />
          <small>{t.interestsHint}</small>
        </div>

        <div className={styles.aiField}>
          <label>{t.travelStyle}</label>
          <select
            value={form.travel_style}
            onChange={(e) => setForm({ ...form, travel_style: e.target.value })}
          >
            <option value="">{t.selectStyle}</option>
            <option value="relaxed">{t.relaxed}</option>
            <option value="adventure">{t.adventure}</option>
            <option value="family-friendly">{t.family}</option>
            <option value="cultural">{t.cultural}</option>
            <option value="budget-friendly">{t.budgetFriendly}</option>
            <option value="luxury">{t.luxury}</option>
          </select>
        </div>

        <div className={styles.aiField}>
          <label>{t.preferences}</label>
          <textarea
            value={form.preferences}
            placeholder={t.preferencesPlaceholder}
            onChange={(e) => setForm({ ...form, preferences: e.target.value })}
          />
        </div>

        <div className={styles.aiField}>
          <label>{t.constraints}</label>
          <input
            value={form.constraints}
            placeholder={t.constraintsPlaceholder}
            onChange={(e) => setForm({ ...form, constraints: e.target.value })}
          />
          <small>{t.constraintsHint}</small>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.aiActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => router.push("/dashboard")}
          >
            {t.cancel}
          </button>

          <button
            type="submit"
            className={styles.aiGenerateButton}
            disabled={generating}
          >
            {generating ? t.generating : t.generate}
          </button>
        </div>
      </form>
    </div>
  );
}