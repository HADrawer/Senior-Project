"use client";


import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

const CATEGORIES_CACHE_KEY = "place_categories";
const PLANS_CACHE_KEY = "dashboard_plans";
const integerInputPattern = /^\d*$/;
const budgetInputPattern = /^\d*(?:\.\d{0,3})?$/;

function updateIntegerField(setForm, field, value) {
  if (!integerInputPattern.test(value)) return;
  setForm((currentForm) => ({ ...currentForm, [field]: value }));
}

function updateBudgetField(setForm, value) {
  if (!budgetInputPattern.test(value)) return;
  setForm((currentForm) => ({ ...currentForm, budget: value }));
}

export default function CreatePlanPage() {
  const router = useRouter();

  const { lang, dir } = useLanguage();
  const [form, setForm] = useState({
    title: "",
    days: "",
    budget: "",
    selected_preferences: [],
    travel_style: "",
    extra_preferences: "",
    constraints: "",
    people_count: "",
  });

  const [categories, setCategories] = useState([]);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const content = {
    en: {
      badge: "AI Tourism Planner",
      title: "Create Your Bahrain Plan",
      subtitle:
        "Set your budget, duration, travel style, preferences, and constraints so Alsaeh.bh can build a personal Bahrain itinerary.",
      planTitle: "Plan Title",
      planTitlePlaceholder: "Relaxed Bahrain Weekend",
      days: "Number of Days",
      daysPlaceholder: "2",
      daysHint: "Whole numbers only, from 1 to 14.",
      budget: "Budget (BHD)",
      budgetPlaceholder: "195.650",
      budgetHint: "Use numbers only. Decimals can include up to 3 digits.",
      people: "Number of People",
      preferencesLabel: "Preferences",
      preferencesPlaceholder: "Select one or more preferences",
      allPreferences: "Select all preferences",
      selectedCount: "selected",
      noPreferences: "No preferences available",
      loadingCategories: "Loading preferences...",
      travelStyle: "Travel Style",
      selectStyle: "Select travel style",
      relaxed: "Relaxed",
      adventure: "Adventure",
      family: "Family-friendly",
      friends: "Friends",
      soloTravel: "Solo Travel",
      cultural: "Cultural",
      budgetFriendly: "Budget-friendly",
      luxury: "Luxury",
      extraPreferences: "Extra Preferences",
      extraPreferencesPlaceholder:
        "Example: low walking, indoor preferred, suitable for family",
      constraints: "Constraints",
      constraintsPlaceholder:
        "Example: indoor preferred, no expensive restaurants",
      constraintsHint: "Separate constraints with commas.",
      cancel: "Cancel",
      generate: "Generate AI Plan",
      generating: "Generating plan...",
      serverError: "Unable to connect to server",
      daysError: "Number of days must be a whole number from 1 to 14.",
      budgetError:
        "Budget must be a positive BHD amount with up to 3 decimal places.",
      peopleError: "Number of people must be a whole number from 1 to 50.",
      preferencesError: "Select at least one preference.",
    },
    ar: {
      badge: "مخطط سياحي بالذكاء الاصطناعي",
      title: "أنشئ خطتك السياحية في البحرين",
      subtitle:
        "حدد ميزانيتك ومدة الرحلة ونمط السفر والتفضيلات والقيود لإنشاء خطة سياحية مخصصة في البحرين.",
      planTitle: "عنوان الخطة",
      planTitlePlaceholder: "عطلة هادئة في البحرين",
      days: "عدد الأيام",
      daysPlaceholder: "2",
      daysHint: "أرقام صحيحة فقط من 1 إلى 14.",
      budget: "الميزانية (BHD)",
      budgetPlaceholder: "195.650",
      budgetHint: "استخدم الأرقام فقط. يمكن أن تحتوي الكسور على 3 خانات كحد أقصى.",
      people: "عدد الأفراد",
      preferencesLabel: "التفضيلات",
      preferencesPlaceholder: "اختر تفضيلاً واحداً أو أكثر",
      allPreferences: "تحديد كل التفضيلات",
      selectedCount: "محدد",
      noPreferences: "لا توجد تفضيلات متاحة",
      loadingCategories: "جاري تحميل التفضيلات...",
      travelStyle: "نمط الرحلة",
      selectStyle: "اختر نمط الرحلة",
      relaxed: "هادئة",
      adventure: "مغامرة",
      family: "مناسبة للعائلة",
      friends: "أصدقاء",
      soloTravel: "سفر فردي",
      cultural: "ثقافية",
      budgetFriendly: "اقتصادية",
      luxury: "فاخرة",
      extraPreferences: "تفضيلات إضافية",
      extraPreferencesPlaceholder:
        "مثال: مشي قليل، أماكن داخلية، مناسبة للعائلة",
      constraints: "القيود",
      constraintsPlaceholder:
        "مثال: أماكن داخلية، بدون مطاعم غالية",
      constraintsHint: "افصل بين القيود باستخدام الفواصل.",
      cancel: "إلغاء",
      generate: "إنشاء الخطة بالذكاء الاصطناعي",
      generating: "جاري إنشاء الخطة...",
      serverError: "تعذر الاتصال بالخادم",
      daysError: "يجب أن يكون عدد الأيام رقماً صحيحاً من 1 إلى 14.",
      budgetError:
        "يجب أن تكون الميزانية مبلغاً موجباً بالدينار مع 3 خانات عشرية كحد أقصى.",
      peopleError: "يجب أن يكون عدد الأفراد رقماً صحيحاً من 1 إلى 50.",
      preferencesError: "اختر تفضيلاً واحداً على الأقل.",
    },
  };

  const t = content[lang];
  const dayPattern = /^(?:[1-9]|1[0-4])$/;
  const peoplePattern = /^(?:[1-9]|[1-4][0-9]|50)$/;
  const budgetPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/;

  const preferenceOptions = categories.map((category) => ({
    id: category.id,
    value: category.name,
    label: category.name.replaceAll("_", " "),
  }));
  const selectedPreferenceLabels = preferenceOptions
    .filter((category) => form.selected_preferences.includes(category.value))
    .map((category) => category.label);
  const allPreferencesSelected =
    preferenceOptions.length > 0 &&
    form.selected_preferences.length === preferenceOptions.length;

  const loadCategories = useCallback(async (tokenFromInit = null) => {
    try {
      const token = tokenFromInit || (await getAccessToken());

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/place-categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error("Load categories error:", error);
    } finally {
      setLoadingCategories(false);
    }
  }, [router]);

  useEffect(() => {
    async function initPage() {
      const cached = sessionStorage.getItem(CATEGORIES_CACHE_KEY);
      if (cached) {
        try {
          setCategories(JSON.parse(cached));
          setLoadingCategories(false);
        } catch {
          sessionStorage.removeItem(CATEGORIES_CACHE_KEY);
        }
      }

      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      await loadCategories(token);
    }

    initPage();
  }, [loadCategories, router]);

  function updatePreference(value, checked) {
    setForm((currentForm) => {
      const current = currentForm.selected_preferences;
      const selected_preferences = checked
        ? Array.from(new Set([...current, value]))
        : current.filter((item) => item !== value);

      return { ...currentForm, selected_preferences };
    });
  }

  function toggleAllPreferences(checked) {
    setForm((currentForm) => ({
      ...currentForm,
      selected_preferences: checked
        ? preferenceOptions.map((category) => category.value)
        : [],
    }));
  }

  function validateForm() {
    if (!dayPattern.test(form.days)) return t.daysError;
    if (form.budget !== "" && !budgetPattern.test(form.budget)) {
      return t.budgetError;
    }
    if (!peoplePattern.test(form.people_count)) return t.peopleError;
    if (form.selected_preferences.length === 0) return t.preferencesError;
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setGenerating(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const constraintsList = form.constraints
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/generate-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.title,
            days: Number(form.days),
            budget: form.budget ? Number(form.budget) : null,
            preferences: form.selected_preferences,
            travel_style: form.travel_style || null,
            extra_preferences: form.extra_preferences || null,
            constraints: constraintsList,
            language: "auto",
            people_count: Number(form.people_count),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          typeof data.detail === "string"
            ? data.detail.includes("busy")
              ? lang === "ar"
                ? "الذكاء الاصطناعي تحت ضغط عالٍ، حاول مرة أخرى بعد لحظات."
                : "AI is under heavy load, try again in a few seconds."
              : data.detail
            : lang === "ar"
              ? "خدمة الذكاء الاصطناعي مشغولة. يرجى المحاولة مرة أخرى."
              : "AI service is busy. Please try again."
        );
        return;
      }

      sessionStorage.removeItem(PLANS_CACHE_KEY);
      router.push(`/dashboard/plans/${data.plan_id}`);
    } catch (error) {
      console.error("Generate plan error:", error);
      setError(t.serverError);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className={styles.pageContent} dir={dir}>
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.days}
              placeholder={t.daysPlaceholder}
              onChange={(e) =>
                updateIntegerField(setForm, "days", e.target.value)
              }
              required
            />
            <small>{t.daysHint}</small>
          </div>

          <div className={styles.aiField}>
            <label>{t.budget}</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.budget}
              placeholder={t.budgetPlaceholder}
              onChange={(e) => updateBudgetField(setForm, e.target.value)}
            />
            <small>{t.budgetHint}</small>
          </div>

          <div className={styles.aiField}>
            <label>{t.people}</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.people_count}
              placeholder="2"
              onChange={(e) =>
                updateIntegerField(setForm, "people_count", e.target.value)
              }
              required
            />
          </div>

          <div className={styles.aiField}>
            <label>{t.travelStyle}</label>
            <select
              value={form.travel_style}
              onChange={(e) =>
                setForm({ ...form, travel_style: e.target.value })
              }
            >
              <option value="">{t.selectStyle}</option>
              <option value="relaxed">{t.relaxed}</option>
              <option value="adventure">{t.adventure}</option>
              <option value="family-friendly">{t.family}</option>
              <option value="friends">{t.friends}</option>
              <option value="solo-travel">{t.soloTravel}</option>
              <option value="cultural">{t.cultural}</option>
              <option value="budget-friendly">{t.budgetFriendly}</option>
              <option value="luxury">{t.luxury}</option>
            </select>
          </div>
        </div>

        <div className={styles.aiField}>
          <label>{t.preferencesLabel}</label>
          <div className={styles.preferenceDropdown}>
            <button
              type="button"
              className={styles.preferenceTrigger}
              onClick={() => setPreferencesOpen((open) => !open)}
              aria-expanded={preferencesOpen}
            >
              <span>
                {selectedPreferenceLabels.length
                  ? `${selectedPreferenceLabels.length} ${t.selectedCount}`
                  : loadingCategories
                    ? t.loadingCategories
                    : t.preferencesPlaceholder}
              </span>
              <span className={styles.preferenceChevron}>v</span>
            </button>

            {selectedPreferenceLabels.length > 0 && (
              <div className={styles.preferenceChips}>
                {selectedPreferenceLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            )}

            {preferencesOpen && (
              <div className={styles.preferencePanel}>
                <label className={styles.preferenceOption}>
                  <input
                    type="checkbox"
                    checked={allPreferencesSelected}
                    onChange={(e) => toggleAllPreferences(e.target.checked)}
                    disabled={preferenceOptions.length === 0}
                  />
                  <span>{t.allPreferences}</span>
                </label>

                <div className={styles.preferenceDivider} />

                {preferenceOptions.length === 0 ? (
                  <p className={styles.preferenceEmpty}>
                    {loadingCategories ? t.loadingCategories : t.noPreferences}
                  </p>
                ) : (
                  preferenceOptions.map((category) => (
                    <label
                      key={category.id}
                      className={styles.preferenceOption}
                    >
                      <input
                        type="checkbox"
                        checked={form.selected_preferences.includes(
                          category.value
                        )}
                        onChange={(e) =>
                          updatePreference(category.value, e.target.checked)
                        }
                      />
                      <span>{category.label}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.aiField}>
          <label>{t.extraPreferences}</label>
          <textarea
            value={form.extra_preferences}
            placeholder={t.extraPreferencesPlaceholder}
            onChange={(e) =>
              setForm({ ...form, extra_preferences: e.target.value })
            }
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
