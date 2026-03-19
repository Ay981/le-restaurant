"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function Page() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      router.replace("/");
      return;
    }

    setSuccessMessage("Account created. Please check your email to confirm your account before signing in.");
  };

  return (
    <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <span aria-hidden>←</span>
          Back to Dashboard
        </Link>

        <section className="app-bg-panel rounded-2xl border border-white/10 p-5 md:p-6">
          <h1 className="text-2xl font-semibold md:text-3xl">Create Account</h1>
          <p className="mt-1 text-sm text-gray-400">Add a new account from the dashboard.</p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="text-sm text-gray-300">
              Full Name
              <input
                type="text"
                placeholder="Enter full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100 outline-none"
                autoComplete="name"
                required
              />
            </label>

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

            

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm text-gray-300">
                Password
                <input
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100 outline-none"
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="text-sm text-gray-300">
                Confirm Password
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100 outline-none"
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>

            {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm text-green-300">{successMessage}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="app-bg-accent mt-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/sign-in" className="app-text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
