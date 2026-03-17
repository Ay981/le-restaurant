import Link from "next/link";

export default function Page() {
  return (
    <main className="app-bg-main min-h-screen px-6 py-8 text-white md:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold">Orders</h1>
        <p className="mt-2 text-gray-400">
          Order management view is ready for the next implementation pass.
        </p>
        <Link
          href="/"
          className="app-bg-accent mt-6 inline-flex rounded-xl px-5 py-3 font-medium text-white"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}