"use client";

import { useMemo, useState } from "react";
import type { Dish } from "@/lib/data";

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

  const byTitle = useMemo(() => {
    return new Map(dishes.map((dish) => [dish.title, dish]));
  }, [dishes]);

  const generate = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setFallbackReason("");

    try {
      const response = await fetch("/api/chat/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
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
    <div className="mt-6 rounded-2xl border border-white/10 app-bg-panel p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Not sure what to choose?</h3>
          <p className="mt-1 text-sm text-gray-400">Chat with AI and get dish suggestions in seconds.</p>
        </div>

        <button
          type="button"
          className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? "Hide Chat" : "Talk to Chatbot"}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-5 space-y-4">
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
              options={["Any", "Noodle", "Pasta", "Soup", "Grill", "Rice"]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, cuisine: value }))}
            />
            <SelectField
              label="Spice Level"
              value={answers.spiceLevel}
              options={["Mild", "Medium", "Spicy"]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, spiceLevel: value }))}
            />
            <SelectField
              label="Budget"
              value={answers.budget}
              options={["Low", "Medium", "High"]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, budget: value }))}
            />
            <SelectField
              label="Dietary"
              value={answers.dietary}
              options={["No preference", "Vegetarian", "High-protein"]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, dietary: value }))}
            />
            <SelectField
              label="Meal Type"
              value={answers.mealType}
              options={["Light", "Filling"]}
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
      ) : null}
    </div>
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
