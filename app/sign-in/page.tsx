"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getNextPath = () => {
    if (typeof window === "undefined") {
      return "/menu";
    }

    const nextValue = new URLSearchParams(window.location.search).get("next");

    if (!nextValue || typeof nextValue !== "string") {
      return "/menu";
    }

    const sanitizedNext = nextValue.trim();
    const isValidRelativePath =
      sanitizedNext.startsWith("/") &&
      !sanitizedNext.startsWith("//") &&
      !sanitizedNext.includes("://") &&
      !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(sanitizedNext);

    return isValidRelativePath ? sanitizedNext : "/menu";
  };

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const hydrate = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.replace(getNextPath());
        return;
      }

      setIsCheckingSession(false);
    };

    void hydrate();
  }, [router]);

  if (isCheckingSession) {
    return (
      <main className="app-bg-main flex min-h-screen items-center justify-center px-4 text-white">
        <p className="text-sm text-gray-300">Checking session...</p>
      </main>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.replace(getNextPath());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-md">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <span aria-hidden>←</span>
          Back to Dashboard
        </Link>

        <section className="app-bg-panel rounded-2xl border border-white/10 p-5 md:p-6">
          <h1 className="text-2xl font-semibold md:text-3xl">Sign In</h1>
          <p className="mt-1 text-sm text-gray-400">Access your dashboard account.</p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="text-sm text-gray-300">
              Email Address
              <input
                type="email"
                placeholder="name@restaurant.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100 outline-none"
                autoComplete="email"
                required
              />
            </label>

            <label className="text-sm text-gray-300">
              Password
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100 outline-none"
                autoComplete="current-password"
                required
              />
            </label>

            {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="app-bg-accent mt-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-sm text-gray-400">
              Need a new account?{" "}
              <Link href="/create-account" className="app-text-accent hover:underline">
                Create account
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
