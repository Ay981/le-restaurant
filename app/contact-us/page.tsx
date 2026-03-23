import Link from "next/link";

export default function ContactUsRedirectPage() {
  return (
    <main className="app-bg-main min-h-screen text-white">
      <section className="w-full px-3 py-3 md:px-5 md:py-5 lg:px-6">
        <header className="app-bg-panel rounded-2xl border border-white/10 px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="app-bg-logo flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-sm font-bold app-text-accent">
                FR
              </div>
              <p className="text-lg font-semibold tracking-wide">FLAVOURS</p>
            </div>

            <nav className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
              <Link className="hover:text-white" href="/">Home</Link>
              <Link className="hover:text-white" href="/about-us">About Us</Link>
              <Link className="app-text-accent" href="/contact-us">Contact Us</Link>
            </nav>

            <Link href="/menu" className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white">
              Order Now
            </Link>
          </div>
        </header>

        <div className="relative mt-3 overflow-hidden rounded-3xl border border-white/10 app-bg-panel p-5 md:p-8 lg:mt-4 lg:p-10">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full app-bg-accent opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-10 h-56 w-56 rounded-full app-bg-accent opacity-10 blur-3xl" />

          <div className="relative z-10 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-semibold tracking-wide app-text-accent">
                CONTACT & SUPPORT
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl xl:text-6xl">
                Reach Our Team
                <br />
                For Order Help,
                <br />
                Feedback, or Booking Questions
              </h1>
              <p className="mt-5 max-w-2xl text-sm text-gray-300 md:text-base">
                For order-related support, open the messages area to contact the restaurant team directly with your order details attached.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/messages" className="app-bg-accent rounded-xl px-5 py-3 text-sm font-semibold text-white">
                  Open Messages
                </Link>
                <Link href="/my-orders" className="app-hover-accent-soft rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-gray-200">
                  View My Orders
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <article className="app-bg-elevated rounded-2xl border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Call Us</p>
                <p className="mt-2 text-sm text-gray-100">+216 70 000 000</p>
                <p className="mt-1 text-xs text-gray-400">Daily support during restaurant operating hours.</p>
              </article>

              <article className="app-bg-elevated rounded-2xl border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                <p className="mt-2 text-sm text-gray-100">hello@flavours.com</p>
                <p className="mt-1 text-xs text-gray-400">Best for business inquiries and reservations.</p>
              </article>

              <article className="app-bg-elevated rounded-2xl border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Visit</p>
                <p className="mt-2 text-sm text-gray-100">Downtown Main Street, City Center</p>
                <p className="mt-1 text-xs text-gray-400">Dine-in, takeaway pickup, and delivery dispatch.</p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
