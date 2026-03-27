import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumeRateLimit } from "@/lib/security/rate-limit";

type DishInput = {
  title: string;
  price: number;
  availability: string;
  image: string;
  categories: string[];
};

type ChatAnswers = {
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

type RecommendationRequest = {
  answers: ChatAnswers;
  dishes: DishInput[];
};

type RecommendationItem = {
  title: string;
  reason: string;
};

type GeminiResult = {
  recommendations: RecommendationItem[] | null;
  fallbackReason: string | null;
};

function dedupeRecommendations(items: RecommendationItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const normalizedTitle = item.title.trim().toLowerCase();
    if (!normalizedTitle || seen.has(normalizedTitle)) {
      return false;
    }

    seen.add(normalizedTitle);
    return true;
  });
}

const DEFAULT_GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];
const RETRYABLE_STATUS_CODES = new Set([429, 503]);
const MAX_ATTEMPTS_PER_MODEL = 2;
const MAX_DISHES_PER_REQUEST = 120;
const MAX_TITLE_LENGTH = 140;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RECOMMEND_RATE_LIMIT_PER_MINUTE ?? "20");

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function uniqueModels(models: string[]) {
  const normalized = models.map((model) => model.trim()).filter((model) => model.length > 0);
  return [...new Set(normalized)];
}

function userFriendlyStatusReason(status: number) {
  if (status === 429) {
    return "Gemini quota/rate-limit reached (429). Wait a bit or use a higher quota key.";
  }

  if (status === 401 || status === 403) {
    return "Gemini key is invalid or lacks permission for the selected model.";
  }

  if (status === 404) {
    return "Selected Gemini model was not found. Check GEMINI_MODEL.";
  }

  return `Gemini request failed (${status}).`;
}

function extractApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const errorValue = (payload as { error?: unknown }).error;
  if (!errorValue || typeof errorValue !== "object") {
    return null;
  }

  const message = (errorValue as { message?: unknown }).message;
  return typeof message === "string" && message.trim().length > 0 ? message.trim() : null;
}

function parseJsonFromText<T>(text: string): T | null {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continue
  }

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) {
    try {
      return JSON.parse(codeFenceMatch[1]) as T;
    } catch {
      // continue
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const objectSlice = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(objectSlice) as T;
    } catch {
      // ignore
    }
  }

  return null;
}

const BUDGET_CAP: Record<string, number> = {
  low: 3,
  medium: 4,
  high: Number.POSITIVE_INFINITY,
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildRuleBasedRecommendations(
  dishes: DishInput[],
  answers: ChatAnswers,
): RecommendationItem[] {
  const favorite = normalize(answers.favoriteRecipe);
  const cuisine = normalize(answers.cuisine);
  const spice = normalize(answers.spiceLevel);
  const dietary = normalize(answers.dietary);
  const mealType = normalize(answers.mealType);
  const occasion = normalize(answers.occasion);
  const proteins = normalize(answers.proteins);
  const restrictions = normalize(answers.restrictions);
  const budget = normalize(answers.budget);
  const budgetCap = BUDGET_CAP[budget] ?? Number.POSITIVE_INFINITY;

  const scored = dishes.map((dish) => {
    const haystack = `${dish.title} ${dish.categories.join(" ")}`.toLowerCase();
    let score = 0;

    if (favorite && haystack.includes(favorite)) score += 4;
    if (cuisine && cuisine !== "any" && haystack.includes(cuisine)) score += 3;
    if (spice === "spicy" && /spicy|hot/.test(haystack)) score += 3;
    if (spice === "very spicy" && /spicy|hot|fiery|flame/.test(haystack)) score += 3;
    if (spice === "mild" && !/spicy|hot/.test(haystack)) score += 2;
    if (dietary === "vegetarian" && /vegetable|veggie|spinach|mushroom/.test(haystack)) score += 3;
    if (dietary === "vegan" && /vegetable|veggie|spinach|mushroom|fruit|lentil|bean/.test(haystack)) score += 3;
    if (dietary === "high-protein" && /beef|chicken|seafood|egg|grill/.test(haystack)) score += 3;
    if (dietary === "low-carb" && /salad|soup|grill|protein|vegetable/.test(haystack)) score += 2;
    if (mealType === "light" && /soup|salad|cold/.test(haystack)) score += 2;
    if (mealType === "filling" && /rice|noodle|pasta|grill/.test(haystack)) score += 2;
    if (mealType === "balanced" && /grill|vegetable|salad|protein/.test(haystack)) score += 2;
    if (occasion === "quick bite" && /appetizer|snack|side|soup/.test(haystack)) score += 2;
    if (occasion === "celebration" && /signature|special|premium|platter/.test(haystack)) score += 2;
    if (proteins === "chicken" && /chicken|poultry/.test(haystack)) score += 2;
    if (proteins === "beef" && /beef|steak/.test(haystack)) score += 2;
    if (proteins === "seafood" && /seafood|fish|shrimp|salmon|tuna/.test(haystack)) score += 2;
    if (proteins === "egg" && /egg|omelet/.test(haystack)) score += 2;
    if (proteins === "plant-based" && /veggie|vegetable|lentil|bean|tofu/.test(haystack)) score += 2;
    if (restrictions === "gluten-free" && !/bread|wheat|flour|pasta/.test(haystack)) score += 1;
    if (restrictions === "dairy-free" && !/cheese|cream|butter|milk/.test(haystack)) score += 1;
    if (restrictions === "nut-free" && !/peanut|almond|walnut|cashew/.test(haystack)) score += 1;
    if (dish.price <= budgetCap) score += 2;

    return { dish, score };
  });

  return scored
    .sort((left, right) => right.score - left.score || left.dish.price - right.dish.price)
    .slice(0, 5)
    .map(({ dish }) => ({
      title: dish.title,
      reason: `Matches your ${answers.mealType.toLowerCase()} meal style, ${answers.dietary.toLowerCase()} preference, and ${answers.budget.toLowerCase()} budget.`,
    }));
}

async function getGeminiRecommendations(
  dishes: DishInput[],
  answers: ChatAnswers,
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return {
      recommendations: null,
      fallbackReason: "Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in server environment.",
    };
  }

  const configuredModel = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODELS[0];
  const configuredFallbackModels = (process.env.GEMINI_FALLBACK_MODELS ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter((model) => model.length > 0);
  const modelsToTry = uniqueModels([configuredModel, ...configuredFallbackModels, ...DEFAULT_GEMINI_MODELS]);

  const prompt = [
    "You are a professional restaurant AI recommender assistant.",
    "Given user preferences and available dishes, return exactly 5 recommendations.",
    "Rules:",
    "- Recommend only from provided dishes.",
    "- Use ALL user preferences holistically: favoriteRecipe, cuisine, spiceLevel, budget, dietary, mealType, occasion, proteins, restrictions.",
    "- Prioritize dishes that satisfy multiple preferences at the same time.",
    "- Keep reasons short (max 20 words each), specific, and practical.",
    "- Output strict JSON as {\"recommendations\":[{\"title\":string,\"reason\":string}]}",
    "User preferences:",
    JSON.stringify(answers),
    "Available dishes:",
    JSON.stringify(dishes),
  ].join("\n");

  const allowedTitles = new Set(dishes.map((dish) => dish.title));
  let lastFailureReason = "Gemini request failed.";

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        let apiMessage: string | null = null;
        try {
          const errorJson = (await response.json()) as unknown;
          apiMessage = extractApiErrorMessage(errorJson);
        } catch {
          // ignore non-json errors
        }

        const statusReason = userFriendlyStatusReason(response.status);
        lastFailureReason = apiMessage ? `${statusReason} ${apiMessage}` : statusReason;

        const shouldRetry = RETRYABLE_STATUS_CODES.has(response.status) && attempt < MAX_ATTEMPTS_PER_MODEL;
        if (shouldRetry) {
          await sleep(350 * attempt);
          continue;
        }

        break;
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastFailureReason = "Gemini returned an empty response.";
        break;
      }

      const parsed = parseJsonFromText<{ recommendations?: RecommendationItem[] }>(text);
      if (!parsed?.recommendations || !Array.isArray(parsed.recommendations)) {
        lastFailureReason = "Gemini response was not valid recommendation JSON.";
        break;
      }

      const cleaned = parsed.recommendations
        .filter((item) => allowedTitles.has(item.title))
        .map((item) => ({
          title: item.title,
          reason: item.reason?.trim() || "Matches your preferences.",
        }));

      const uniqueRecommendations = dedupeRecommendations(cleaned).slice(0, 5);

      if (uniqueRecommendations.length === 0) {
        lastFailureReason = "Gemini recommendations did not match available dishes.";
        break;
      }

      return {
        recommendations: uniqueRecommendations,
        fallbackReason: null,
      };
    }
  }

  return {
    recommendations: null,
    fallbackReason: lastFailureReason,
  };
}

function getBearerToken(request: Request): string | null {
  const authorizationHeader = request.headers.get("authorization");
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function getSupabasePublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public env vars.");
  }
  return { supabaseUrl, supabaseAnonKey };
}

async function requireAuthenticatedUser(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuthenticatedUser(request);
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required. Please sign in to use recommendations." },
        { status: 401 },
      );
    }

    const rate = await consumeRateLimit({
      key: `chat:recommend:${userId}`,
      maxRequests: Number.isFinite(RATE_LIMIT_MAX_REQUESTS) && RATE_LIMIT_MAX_REQUESTS > 0 ? RATE_LIMIT_MAX_REQUESTS : 20,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    let body: RecommendationRequest;
    try {
      body = (await request.json()) as RecommendationRequest;
    } catch {
      return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    const dishes = Array.isArray(body?.dishes) ? body.dishes : [];

    if (dishes.length === 0) {
      return NextResponse.json({ message: "No dishes available for recommendations." }, { status: 400 });
    }
    if (dishes.length > MAX_DISHES_PER_REQUEST) {
      return NextResponse.json({ message: "Too many dishes in one request." }, { status: 400 });
    }
    const hasInvalidDish = dishes.some(
      (dish) =>
        typeof dish?.title !== "string" ||
        dish.title.trim().length === 0 ||
        dish.title.length > MAX_TITLE_LENGTH ||
        !Number.isFinite(Number(dish.price)),
    );
    if (hasInvalidDish) {
      return NextResponse.json({ message: "Invalid dish payload." }, { status: 400 });
    }

    const answers: ChatAnswers = {
      favoriteRecipe: body?.answers?.favoriteRecipe ?? "",
      cuisine: body?.answers?.cuisine ?? "Any",
      spiceLevel: body?.answers?.spiceLevel ?? "Mild",
      budget: body?.answers?.budget ?? "Medium",
      dietary: body?.answers?.dietary ?? "No preference",
      mealType: body?.answers?.mealType ?? "Filling",
      occasion: body?.answers?.occasion ?? "Casual",
      proteins: body?.answers?.proteins ?? "Any",
      restrictions: body?.answers?.restrictions ?? "None",
    };

    const geminiResult = await getGeminiRecommendations(dishes, answers);
    const recommendations = dedupeRecommendations(
      geminiResult.recommendations ?? buildRuleBasedRecommendations(dishes, answers),
    );

    return NextResponse.json({
      recommendations,
      source: geminiResult.recommendations ? "gemini" : "rule-based",
      fallbackReason: geminiResult.recommendations ? null : geminiResult.fallbackReason,
    });
  } catch {
    return NextResponse.json({ message: "Failed to generate recommendations." }, { status: 500 });
  }
}
