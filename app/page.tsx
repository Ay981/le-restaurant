import Link from "next/link";
import Image from "next/image";
import { dishes } from "@/lib/data";
import { formatCurrency } from "@/lib/currency";
import { t } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";

export default async function Page() {
  const locale = await getServerLocale();
  const featuredDishes = dishes.slice(0, 2);
  const showcaseImages = ["/image/pizza.png", "/image/image.png"];
  const highlights = [
    { label: t(locale, "home", "statPrepLabel"), value: t(locale, "home", "statPrepValue") },
    { label: t(locale, "home", "statCustomersLabel"), value: t(locale, "home", "statCustomersValue") },
    { label: t(locale, "home", "statCategoriesLabel"), value: t(locale, "home", "statCategoriesValue") },
  ];

  return (
    <main className="app-bg-main min-h-screen text-white">
      <section className="flex min-h-screen w-full flex-col px-3 py-3 md:px-5 md:py-5 lg:px-6">
        <header className="app-bg-panel rounded-2xl border border-white/10 px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="app-bg-logo flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-sm font-bold app-text-accent">
                {t(locale, "common", "brandShort")}
              </div>
              <p className="text-lg font-semibold tracking-wide">{t(locale, "common", "brandName")}</p>
            </div>

            <nav className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
              <Link className="app-text-accent" href="/">{t(locale, "common", "navHome")}</Link>
              <Link className="hover:text-white" href="/about-us">{t(locale, "common", "navAbout")}</Link>
              <Link className="hover:text-white" href="/products">{t(locale, "common", "navProducts")}</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/menu"
                className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white"
              >
                {t(locale, "common", "orderNow")}
              </Link>
            </div>
          </div>

          <nav className="mt-3 flex items-center gap-4 text-xs text-gray-300 md:hidden">
            <Link className="app-text-accent" href="/">{t(locale, "common", "navHome")}</Link>
            <Link className="hover:text-white" href="/about-us">{t(locale, "common", "navAbout")}</Link>
            <Link className="hover:text-white" href="/products">{t(locale, "common", "navProducts")}</Link>
          </nav>
        </header>

        <div className="relative mt-3 overflow-hidden rounded-3xl border border-white/10 app-bg-panel p-5 md:p-8 lg:mt-4 lg:p-10">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full app-bg-accent opacity-15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-12 h-64 w-64 rounded-full app-bg-accent opacity-15 blur-3xl" />

          <div className="relative z-10 grid w-full gap-8 lg:grid-cols-2 lg:items-center">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-semibold tracking-wide app-text-accent">
                {t(locale, "home", "welcomeBadge")}
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl xl:text-7xl">
                {t(locale, "home", "titleLine1")}
                <br />
                {t(locale, "home", "titleLine2")}
                <br />
                {t(locale, "home", "titleLine3")}
              </h1>
              <p className="mt-5 max-w-xl text-base text-gray-300 md:text-lg">
                {t(locale, "home", "subtitle")}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <article key={item.label} className="app-bg-elevated rounded-xl border border-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/menu"
                  className="app-bg-accent rounded-full px-7 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(234,124,105,0.35)]"
                >
                  {t(locale, "common", "orderNow")}
                </Link>
                <Link
                  href="/about-us"
                  className="app-hover-accent-soft rounded-full border border-white/15 px-7 py-3 text-sm font-semibold text-gray-200"
                >
                  {t(locale, "home", "learnMore")}
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto w-full max-w-xl">
                <div className="app-bg-elevated overflow-hidden rounded-3xl border border-white/10 p-2">
                  <div className="h-56 overflow-hidden rounded-2xl sm:h-72 lg:h-84">
                    <Image
                      src="/image/pizza.png"
                      alt="Featured dish"
                      width={900}
                      height={600}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {featuredDishes.map((dish, index) => (
                    <article key={dish.title} className="app-bg-elevated rounded-2xl border border-white/10 p-3">
                      <div className="h-24 overflow-hidden rounded-xl border border-white/10">
                        <Image
                          src={showcaseImages[index] ?? "/image/pizza.png"}
                          alt={dish.title}
                          width={320}
                          height={160}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="mt-3 text-base font-semibold text-gray-100">{dish.title}</p>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-300">
                        <span>★ 5.0</span>
                        <span>{formatCurrency(dish.price)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <article className="app-bg-panel rounded-2xl border border-white/10 p-5 md:p-6">
            <p className="text-xs uppercase tracking-wide text-gray-400">{t(locale, "home", "whyChoose")}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="app-bg-elevated rounded-xl border border-white/10 p-4">
                <p className="text-sm font-semibold">{t(locale, "home", "whyFastTitle")}</p>
                <p className="mt-2 text-xs text-gray-300">{t(locale, "home", "whyFastDesc")}</p>
              </div>
              <div className="app-bg-elevated rounded-xl border border-white/10 p-4">
                <p className="text-sm font-semibold">{t(locale, "home", "whyFreshTitle")}</p>
                <p className="mt-2 text-xs text-gray-300">{t(locale, "home", "whyFreshDesc")}</p>
              </div>
              <div className="app-bg-elevated rounded-xl border border-white/10 p-4">
                <p className="text-sm font-semibold">{t(locale, "home", "whyTrackTitle")}</p>
                <p className="mt-2 text-xs text-gray-300">{t(locale, "home", "whyTrackDesc")}</p>
              </div>
            </div>
          </article>

          <article className="app-bg-panel rounded-2xl border border-white/10 p-5 md:p-6">
            <p className="text-xs uppercase tracking-wide text-gray-400">{t(locale, "home", "quickAccess")}</p>
            <div className="mt-4 grid gap-3">
              <Link href="/products" className="app-hover-accent-soft rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-100">
                {t(locale, "home", "qaProducts")}
              </Link>
              <Link href="/messages" className="app-hover-accent-soft rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-100">
                {t(locale, "home", "qaMessages")}
              </Link>
              <Link href="/notifications" className="app-hover-accent-soft rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-100">
                {t(locale, "home", "qaNotifications")}
              </Link>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}