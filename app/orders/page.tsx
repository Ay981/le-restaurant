import Link from "next/link";
import { ConfirmationPanel, PaymentPanel } from "./_components";

export default function Page() {
  return (
    <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <span aria-hidden>←</span>
          Back to Dashboard
        </Link>

        <div className="app-bg-panel grid overflow-hidden rounded-2xl border border-white/10 xl:grid-cols-[0.95fr_1.05fr]">
          <ConfirmationPanel />
          <PaymentPanel />
        </div>
      </div>
    </main>
  );
}