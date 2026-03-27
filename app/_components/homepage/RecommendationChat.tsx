"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { Dish } from "@/lib/data";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type RecommendationChatProps = {
  dishes: Dish[];
  onAddDish: (dish: Dish) => void;
};

type Answers = {
  favoriteRecipe: string;
  cuisine: string;
  spiceLevel: string;
  budget: string;
  dietary: string;
  mealType: string;
  occasion: string;
  proteins: string;
  restrictions: string;
};

type PreviousOrderRow = {
  order_items: Array<{
    dish_title_snapshot: string;
    quantity: number;
  }> | null;
};

type RecommendationResult = {
  title: string;
  reason: string;
};

const initialAnswers: Answers = {
  favoriteRecipe: "",
  cuisine: "Any",
  spiceLevel: "Mild",
  budget: "Medium",
  dietary: "No preference",
  mealType: "Filling",
  occasion: "Casual",
  proteins: "Any",
  restrictions: "None",
};

export default function RecommendationChat({ dishes, onAddDish }: RecommendationChatProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";

  const [isOpen, setIsOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fallbackReason, setFallbackReason] = useState("");
  const [source, setSource] = useState<"gemini" | "rule-based" | "">("");
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [personalizedDishes, setPersonalizedDishes] = useState<string[]>([]);

  const byTitle = useMemo(() => new Map(dishes.map((dish) => [dish.title, dish])), [dishes]);
  const hasPersonalizedData = isAuthenticated && personalizedDishes.length > 0;

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let mounted = true;

    const loadPersonalizedData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          setIsAuthenticated(false);
          setPersonalizedDishes([]);
          return;
        }

        setIsAuthenticated(true);

        const { data, error } = await supabase
          .from("orders")
          .select("order_items(dish_title_snapshot, quantity)")
          .eq("customer_user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(12);

        if (error || !data) {
          setPersonalizedDishes([]);
          return;
        }

        const counts = new Map<string, number>();

        (data as PreviousOrderRow[]).forEach((order) => {
          order.order_items?.forEach((item) => {
            const title = item.dish_title_snapshot?.trim();
            if (!title) return;
            counts.set(title, (counts.get(title) ?? 0) + Number(item.quantity || 1));
          });
        });

        const top = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([title]) => title);

        setPersonalizedDishes(top);
      } catch {
        if (!mounted) return;
        setPersonalizedDishes([]);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setIsLoadingPreferences(false);
        }
      }
    };

    void loadPersonalizedData();

    return () => {
      mounted = false;
    };
  }, []);

  const applyForYouMode = () => {
    if (!hasPersonalizedData) {
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      favoriteRecipe: personalizedDishes.join(", "),
      cuisine: "For You",
      spiceLevel: "For You",
      budget: "For You",
      dietary: "For You",
      mealType: "For You",
      occasion: "For You",
      proteins: "For You",
      restrictions: "For You",
    }));
  };

  const generate = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setFallbackReason("");

    const normalizeForYou = (value: string, fallback: string) =>
      value === "For You" ? fallback : value;

    const preparedAnswers: Answers = {
      favoriteRecipe:
        answers.favoriteRecipe.trim().length > 0
          ? answers.favoriteRecipe
          : hasPersonalizedData
            ? personalizedDishes.join(", ")
            : "",
      cuisine: normalizeForYou(answers.cuisine, "Any"),
      spiceLevel: normalizeForYou(answers.spiceLevel, "Mild"),
      budget: normalizeForYou(answers.budget, "Medium"),
      dietary: normalizeForYou(answers.dietary, "No preference"),
      mealType: normalizeForYou(answers.mealType, "Filling"),
      occasion: normalizeForYou(answers.occasion, "Casual"),
      proteins: normalizeForYou(answers.proteins, "Any"),
      restrictions: normalizeForYou(answers.restrictions, "None"),
    };

    if (hasPersonalizedData) {
      const isForYouSelected =
        answers.cuisine === "For You" ||
        answers.spiceLevel === "For You" ||
        answers.budget === "For You" ||
        answers.dietary === "For You" ||
        answers.mealType === "For You" ||
        answers.occasion === "For You" ||
        answers.proteins === "For You" ||
        answers.restrictions === "For You";

      if (isForYouSelected) {
        preparedAnswers.favoriteRecipe = `${preparedAnswers.favoriteRecipe} | Previous favorites: ${personalizedDishes.join(", ")}`;
      }
    }

    try {
      const response = await fetch("/api/chat/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: preparedAnswers, dishes }),
      });

      const payload = (await response.json()) as {
        message?: string;
        source?: "gemini" | "rule-based";
        fallbackReason?: string | null;
        recommendations?: RecommendationResult[];
      };

      if (!response.ok) {
        setErrorMessage(payload.message || "Unable to generate recommendations.");
        setRecommendations([]);
        setSource("");
        setFallbackReason("");
        return;
      }

      setRecommendations(payload.recommendations || []);
      setSource(payload.source || "rule-based");
      setFallbackReason(payload.fallbackReason || "");
    } catch {
      setErrorMessage(
        isAmharic
          ? "በአሁኑ ጊዜ ምክሮችን ማመንጨት አልተቻለም።"
          : "Unable to generate recommendations right now.",
      );
      setRecommendations([]);
      setSource("");
      setFallbackReason("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mt-6 rounded-2xl border border-orange-500/30 bg-linear-to-r from-orange-500/10 to-white/5 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">
              🔥 {isAmharic ? "ምግብ ምክር ሞድ" : "AI Recommender"}
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              {isAmharic
                ? "ሰንብዎ ጥቂት ምርጫዎችን ይግቡ፣ AI ለእርስዎ ተስማሚ ምግቦችን ይሰጣል"
                : "Share your mood and preferences, get personalized dish picks instantly."}
            </p>
          </div>

          <button
            type="button"
            className="app-bg-accent rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 hover:shadow-orange-500/40"
            onClick={() => setIsOpen(true)}
          >
            ✨ {isAmharic ? "ይጀምር" : "Open"}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 px-4 py-5 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-linear-to-br from-gray-950 to-gray-900 p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-5">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  🍽️ {isAmharic ? "ምግብ ምክር" : "Food Vibes"}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {isAmharic ? "ምን ሰንብ ወይም ምግብ ትወዳለህ?" : "What are you in the mood for?"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 p-2 text-white transition-colors hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {isAuthenticated ? (
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-orange-200">
                      ⭐ {isAmharic ? "ለእርስዎ" : "For You"}
                    </p>
                    <button
                      type="button"
                      onClick={applyForYouMode}
                      disabled={!hasPersonalizedData || isLoadingPreferences}
                      className="app-bg-accent rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isAmharic ? "ያለፉ ትዕዛዞቼን ተጠቀም" : "Use my history"}
                    </button>
                  </div>

                  {hasPersonalizedData ? (
                    <div className="flex flex-wrap gap-2">
                      {personalizedDishes.map((title) => (
                        <span
                          key={title}
                          className="rounded-full border border-orange-400/40 bg-orange-500/30 px-2.5 py-1 text-xs text-orange-100"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300">
                      {isLoadingPreferences
                        ? isAmharic
                          ? "የምርጫ ታሪክዎ በመጫን ላይ..."
                          : "Loading your preference history..."
                        : isAmharic
                          ? "የግል ምክሮችን ለማግኘት ጥቂት ትዕዛዞች ያስገቡ።"
                          : "Place a few orders first to unlock personalized suggestions."}
                    </p>
                  )}
                </div>
              ) : null}

              <textarea
                value={answers.favoriteRecipe}
                onChange={(event) =>
                  setAnswers((prev) => ({
                    ...prev,
                    favoriteRecipe: event.target.value,
                  }))
                }
                placeholder={
                  isAmharic
                    ? "ለምሳሌ፡ ቅመም ኑድል፣ ጥብስ ዶሮ፣ ፓስታ..."
                    : "e.g. spicy noodles, grilled chicken, creamy pasta..."
                }
                className="app-bg-elevated w-full rounded-xl border border-white/15 px-4 py-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
                rows={2}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label={isAmharic ? "የምግብ አይነት" : "Cuisine"}
                  value={answers.cuisine}
                  options={
                    isAuthenticated
                      ? ["For You", "Any", "Noodle", "Pasta", "Soup", "Grill", "Rice", "Mediterranean", "Asian", "Local"]
                      : ["Any", "Noodle", "Pasta", "Soup", "Grill", "Rice", "Mediterranean", "Asian", "Local"]
                  }
                  locale={locale}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, cuisine: value }))}
                />

                <SelectField
                  label={isAmharic ? "የቅመም ደረጃ" : "Spice Level"}
                  value={answers.spiceLevel}
                  options={
                    isAuthenticated
                      ? ["For You", "Mild", "Medium", "Spicy", "Very Spicy"]
                      : ["Mild", "Medium", "Spicy", "Very Spicy"]
                  }
                  locale={locale}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, spiceLevel: value }))}
                />

                <SelectField
                  label={isAmharic ? "በጀት" : "Budget"}
                  value={answers.budget}
                  options={isAuthenticated ? ["For You", "Low", "Medium", "High", "Premium"] : ["Low", "Medium", "High", "Premium"]}
                  locale={locale}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, budget: value }))}
                />

                <SelectField
                  label={isAmharic ? "የአመጋገብ ምርጫ" : "Dietary"}
                  value={answers.dietary}
                  options={
                    isAuthenticated
                      ? ["For You", "No preference", "Vegetarian", "Vegan", "High-protein", "Low-carb"]
                      : ["No preference", "Vegetarian", "Vegan", "High-protein", "Low-carb"]
                  }
                  locale={locale}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, dietary: value }))}
                />

                <SelectField
                  label={isAmharic ? "የምግብ ክፍል" : "Meal Type"}
                  value={answers.mealType}
                  options={isAuthenticated ? ["For You", "Light", "Filling", "Balanced"] : ["Light", "Filling", "Balanced"]}
                  locale={locale}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, mealType: value }))}
                />

                <SelectField
                  label={isAmharic ? "ሁኔታ" : "Occasion"}
                  value={answers.occasion}
                  options={
                    isAuthenticated
                      ? ["For You", "Casual", "Business", "Celebration", "Quick bite"]
                      : ["Casual", "Business", "Celebration", "Quick bite"]
                  }
                  locale={locale}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, occasion: value }))}
                />

                <SelectField
                  label={isAmharic ? "ፕሮቲን" : "Protein Type"}
                  value={answers.proteins}
                  options={
                    isAuthenticated
                      ? ["For You", "Any", "Chicken", "Beef", "Seafood", "Egg", "Plant-based"]
                      : ["Any", "Chicken", "Beef", "Seafood", "Egg", "Plant-based"]
                  }
                  locale={locale}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, proteins: value }))}
                />

                <SelectField
                  label={isAmharic ? "ገደብ" : "Restrictions"}
                  value={answers.restrictions}
                  options={
                    isAuthenticated
                      ? ["For You", "None", "Gluten-free", "Dairy-free", "Nut-free"]
                      : ["None", "Gluten-free", "Dairy-free", "Nut-free"]
                  }
                  locale={locale}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, restrictions: value }))}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={generate}
                  disabled={isLoading}
                  className="min-w-fit flex-1 rounded-xl bg-linear-to-r from-orange-500 to-orange-600 px-4 py-3 font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-400 hover:to-orange-500 hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading
                    ? isAmharic
                      ? " በማሰብ ላይ..."
                      : " Thinking..."
                    : isAmharic
                      ? " ምክሮችን አግኝ"
                      : " Get recommendations"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAnswers(initialAnswers);
                    setRecommendations([]);
                    setSource("");
                    setErrorMessage("");
                    setFallbackReason("");
                  }}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-semibold text-gray-200 transition-colors hover:bg-white/10"
                >
                  {isAmharic ? "ዳግም" : "Reset"}
                </button>

                {source ? (
                  <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-gray-300">
                    {source === "gemini"
                      ? "⚡ Gemini AI"
                      : isAmharic
                        ? " ተተኪ ስርዓት"
                        : " Smart Engine"}
                  </span>
                ) : null}
              </div>

              {errorMessage ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {errorMessage}
                </p>
              ) : null}

              {!errorMessage && source === "rule-based" && fallbackReason ? (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                   {isAmharic ? "ማስታወሻ:" : "Note:"} {fallbackReason}
                </p>
              ) : null}

              {recommendations.length > 0 ? (
                <div className="space-y-2 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
                  <p className="text-sm font-bold text-orange-200">
                     {isAmharic ? "ለእርስዎ የተመከሩ" : "Recommended for you"}
                  </p>

                  {recommendations.map((item, index) => {
                    const dish = byTitle.get(item.title);

                    return (
                      <div
                        key={`${item.title}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 transition-all hover:bg-white/10"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.reason}</p>
                        </div>

                        <button
                          type="button"
                          disabled={!dish}
                          onClick={() => {
                            if (dish) {
                              onAddDish(dish);
                            }
                          }}
                          className="app-bg-accent whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isAmharic ? "ጨምር" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  locale: "en" | "am";
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, locale, onChange }: SelectFieldProps) {
  const labelMap: Record<string, string> = {
    "For You": "ለእርስዎ",
    Any: "ማንኛውም",
    Noodle: "ኑድል",
    Pasta: "ፓስታ",
    Soup: "ሾርባ",
    Grill: "ግሪል",
    Rice: "ሩዝ",
    Mediterranean: "ሜዲትራኒያን",
    Asian: "እስያዊ",
    Local: "አካባቢያዊ",
    Mild: "ቀላል",
    Medium: "መካከለኛ",
    Spicy: "ቅመም",
    "Very Spicy": "በጣም ቅመም",
    Low: "ዝቅተኛ",
    High: "ከፍተኛ",
    Premium: "ፕሪሚየም",
    "No preference": "ምንም ምርጫ የለም",
    Vegetarian: "ቬጀቴሪያን",
    Vegan: "ቪጋን",
    "High-protein": "ከፍተኛ ፕሮቲን",
    "Low-carb": "ዝቅተኛ ካርብ",
    Light: "ቀላል",
    Filling: "ሙሉ",
    Balanced: "ሚዛናዊ",
    Casual: "መደበኛ",
    Business: "ቢዝነስ",
    Celebration: "ክብረ በዓል",
    "Quick bite": "ፈጣን ምግብ",
    Chicken: "ዶሮ",
    Beef: "ስጋ",
    Seafood: "የባህር ምግብ",
    Egg: "እንቁላል",
    "Plant-based": "ከእፅዋት",
    "Gluten-free": "ግሉተን-ነፃ",
    "Dairy-free": "ወተት-ነፃ",
    "Nut-free": "ነት-ነፃ",
    None: "ምንም የለም",
  };

  return (
    <label className="block text-sm font-medium text-gray-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="app-bg-elevated mt-2 w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-100 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {locale === "am" ? (labelMap[option] ?? option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
