import Link from "next/link";

export default function Page() {
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

          <form className="mt-6 grid gap-4">
            <label className="text-sm text-gray-300">
              Email Address
              <input
                type="email"
                placeholder="name@restaurant.com"
                className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100 outline-none"
              />
            </label>

            <label className="text-sm text-gray-300">
              Password
              <input
                type="password"
                placeholder="password"
                className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100 outline-none"
              />
            </label>

            <button
              type="button"
              className="app-bg-accent mt-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
            >
              Sign In
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
