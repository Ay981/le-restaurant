import Link from "next/link";

const highlights = [
  {
    title: "Restaurant Type",
    description: "Modern casual dining focused on Mediterranean and grill-inspired comfort dishes.",
  },
  {
    title: "Main Location",
    description: "Downtown Main Street, easy access for dine-in, takeaway pickup, and delivery dispatch.",
  },
  {
    title: "Serving Schedule",
    description: "Open daily for lunch and dinner with late-night service on weekends.",
  },
];

export default function AboutUsPage() {
  return (
    <main className="app-bg-main min-h-screen text-white">
      <section className="flex min-h-screen w-full flex-col px-3 py-3 md:px-5 md:py-5 lg:px-6">
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
              <Link className="app-text-accent" href="/about-us">About Us</Link>
              <Link className="hover:text-white" href="/products">Products</Link>
            </nav>

            <Link href="/menu" className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white">
              Order Now
            </Link>
          </div>
        </header>

        <div className="relative mt-3 flex flex-1 overflow-hidden rounded-3xl border border-white/10 app-bg-panel p-5 md:p-8 lg:mt-4 lg:p-10">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full app-bg-accent opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-8 h-56 w-56 rounded-full app-bg-accent opacity-10 blur-3xl" />

          <div className="relative z-10 grid w-full gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-semibold tracking-wide app-text-accent">
                ABOUT FLAVOURS
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl xl:text-6xl">
                A Restaurant Built
                <br />
                Around Great Food,
                <br />
                Consistent Service,
                <br />
                and Local Community
              </h1>
              <p className="mt-5 max-w-2xl text-sm text-gray-300 md:text-base">
                Flavours is a neighborhood restaurant designed for everyday dining. We focus on grilled favorites,
                fresh bowls, and signature plates prepared to order, with quick service for lunch traffic and a warm
                dine-in experience for evening guests.
              </p>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {highlights.map((item) => (
                  <article key={item.title} className="app-bg-elevated rounded-2xl border border-white/10 p-4">
                    <h2 className="text-base font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 text-sm text-gray-300">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-4 self-start">
              <article className="app-bg-elevated rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">Our Story</p>
                <p className="mt-3 text-sm text-gray-200">
                  Started as a small local kitchen in 2019, Flavours grew from a family-run concept into a full
                  service spot known for balanced portions, quality ingredients, and reliable delivery.
                </p>
              </article>

              <article className="app-bg-elevated rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">Service Information</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-200">
                  <li>• Monday - Thursday: 11:30 AM to 10:00 PM</li>
                  <li>• Friday - Sunday: 11:30 AM to 12:00 AM</li>
                  <li>• Dine-in, takeaway, and delivery available daily</li>
                  <li>• Peak prep window: 12:30 PM - 2:00 PM and 7:00 PM - 9:30 PM</li>
                </ul>
              </article>

              <article className="app-bg-elevated rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">Location & Contact</p>
                <p className="mt-3 text-sm text-gray-200">Downtown Main Street, City Center</p>
                <p className="mt-1 text-sm text-gray-300">Phone: +216 70 000 000</p>
                <p className="mt-1 text-sm text-gray-300">Email: hello@flavours.com</p>
                <p className="mt-1 text-sm text-gray-300">Reservations and group bookings available on request.</p>
              </article>

              <div className="flex flex-wrap gap-3">
                <Link href="/menu" className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white">
                  Explore Menu
                </Link>
                <Link href="/messages" className="app-hover-accent-soft rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-gray-200">
                  Send a Message
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
