"use client";

import { useEffect, useMemo, useState } from "react";
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
};

export default function RecommendationChat({ dishes, onAddDish }: RecommendationChatProps) {
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

  const byTitle = useMemo(() => {
    return new Map(dishes.map((dish) => [dish.title, dish]));
  }, [dishes]);

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
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([title]) => title);

        setPersonalizedDishes(top);
      } catch (error) {
        console.error("loadPersonalizedData failed", {
          source: "RecommendationChat",
          client: "createBrowserSupabaseClient",
          error,
        });

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

    setAnswers((previous) => ({
      ...previous,
      favoriteRecipe: personalizedDishes.join(", "),
      cuisine: "For You",
      spiceLevel: "For You",
      budget: "For You",
      dietary: "For You",
      mealType: "For You",
    }));
  };

  const generate = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setFallbackReason("");

    const normalizeForYou = (value: string, fallback: string) => (value === "For You" ? fallback : value);

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
    };

    if (hasPersonalizedData) {
      const isForYouSelected =
        answers.cuisine === "For You" ||
        answers.spiceLevel === "For You" ||
        answers.budget === "For You" ||
        answers.dietary === "For You" ||
        answers.mealType === "For You";

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
        body: JSON.stringify({
          answers: preparedAnswers,
          dishes,
        }),
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
      setErrorMessage("Unable to generate recommendations right now.");
      setRecommendations([]);
      setSource("");
      setFallbackReason("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mt-6 rounded-2xl border border-white/10 app-bg-panel p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Need help choosing?</h3>
            <p className="mt-1 text-sm text-gray-400">Use the AI recommender to get a curated dish list in seconds.</p>
          </div>

          <button
            type="button"
            className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white"
            onClick={() => setIsOpen(true)}
          >
            Open Recommender
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/65 px-4 py-5 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="mx-auto h-full w-full max-w-6xl overflow-y-auto rounded-2xl border border-white/10 app-bg-panel p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">AI Dish Recommender</h3>
                <p className="mt-1 text-sm text-gray-400">Tell us your mood and preferences, we’ll suggest your best matches.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="app-hover-accent-soft rounded-xl border border-white/15 px-3 py-2 text-sm text-gray-200"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
          {isAuthenticated ? (
            <div className="rounded-xl border border-white/10 app-bg-elevated p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-200">For You</p>
                <button
                  type="button"
                  onClick={applyForYouMode}
                  disabled={!hasPersonalizedData || isLoadingPreferences}
                  className="app-bg-accent rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Use my previous orders
                </button>
              </div>
              {hasPersonalizedData ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {personalizedDishes.map((title) => (
                    <span key={title} className="rounded-full border border-white/15 px-2 py-1 text-xs text-gray-200">
                      {title}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-400">
                  {isLoadingPreferences
                    ? "Loading your preference history..."
                    : "Place a few orders first to unlock personalized suggestions."}
                </p>
              )}
            </div>
          ) : null}

          <label className="block text-sm text-gray-300">
            What is your favorite recipe or dish?
            <input
              value={answers.favoriteRecipe}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  favoriteRecipe: event.target.value,
                }))
              }
              placeholder="e.g. spicy noodles, grilled chicken, mushroom pasta"
              className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100 outline-none placeholder:text-gray-500"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField
              label="Cuisine"
              value={answers.cuisine}
              options={isAuthenticated ? ["For You", "Any", "Noodle", "Pasta", "Soup", "Grill", "Rice"] : ["Any", "Noodle", "Pasta", "Soup", "Grill", "Rice"]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, cuisine: value }))}
            />
            <SelectField
              label="Spice Level"
              value={answers.spiceLevel}
              options={isAuthenticated ? ["For You", "Mild", "Medium", "Spicy"] : ["Mild", "Medium", "Spicy"]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, spiceLevel: value }))}
            />
            <SelectField
              label="Budget"
              value={answers.budget}
              options={isAuthenticated ? ["For You", "Low", "Medium", "High"] : ["Low", "Medium", "High"]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, budget: value }))}
            />
            <SelectField
              label="Dietary"
              value={answers.dietary}
              options={isAuthenticated ? ["For You", "No preference", "Vegetarian", "High-protein"] : ["No preference", "Vegetarian", "High-protein"]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, dietary: value }))}
            />
            <SelectField
              label="Meal Type"
              value={answers.mealType}
              options={isAuthenticated ? ["For You", "Light", "Filling"] : ["Light", "Filling"]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, mealType: value }))}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={isLoading}
              className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Thinking..." : "Get recommendations"}
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
              className="app-hover-accent-soft rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-gray-200"
            >
              Reset
            </button>

            {source ? (
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-gray-300">
                Source: {source === "gemini" ? "Gemini AI" : "Fallback engine"}
              </span>
            ) : null}
          </div>

          {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
          {!errorMessage && source === "rule-based" && fallbackReason ? (
            <p className="text-xs text-amber-300">Fallback reason: {fallbackReason}</p>
          ) : null}

          {recommendations.length > 0 ? (
            <div className="space-y-3 rounded-xl border border-white/10 app-bg-elevated p-3">
              <p className="text-sm font-semibold text-gray-200">Recommended for you</p>

              {recommendations.map((item, index) => {
                const dish = byTitle.get(item.title);
                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-100">{item.title}</p>
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
                      className="app-bg-accent rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add to order
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
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="block text-sm text-gray-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
