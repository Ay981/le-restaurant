import Link from "next/link";
import { FaUtensils } from "react-icons/fa";

export default function NotFound() {
  return (
    <main className="app-bg-main relative min-h-screen overflow-hidden px-6 py-10 text-white md:px-10">
      <div className="app-bg-accent pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-15 blur-3xl" />
      <div className="app-bg-elevated pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-40 blur-3xl" />

      <section className="relative mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
        <div className="app-bg-panel w-full rounded-3xl border border-white/10 p-8 text-center shadow-2xl md:p-12">
          <div className="app-bg-logo mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10">
            <FaUtensils className="app-text-accent text-2xl" />
          </div>

          <p className="app-text-accent mt-6 text-sm font-semibold tracking-[0.2em] uppercase">
            Error 404
          </p>
          <h1 className="mt-3 text-6xl font-extrabold leading-none md:text-8xl">Page Not Found</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-300 md:text-lg">
            This table is reserved for another route. The page you requested does not exist,
            or it has moved to a new section of the restaurant dashboard.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="app-bg-accent inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/orders"
              className="app-hover-accent-soft inline-flex rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-gray-200"
            >
              Go to Orders
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
