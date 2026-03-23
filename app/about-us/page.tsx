import Link from "next/link";
import { t } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";

export default async function AboutUsPage() {
  const locale = await getServerLocale();
  const highlights = [
    {
      title: t(locale, "about", "highlightTypeTitle"),
      description: t(locale, "about", "highlightTypeDesc"),
    },
    {
      title: t(locale, "about", "highlightLocationTitle"),
      description: t(locale, "about", "highlightLocationDesc"),
    },
    {
      title: t(locale, "about", "highlightScheduleTitle"),
      description: t(locale, "about", "highlightScheduleDesc"),
    },
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
              <Link className="hover:text-white" href="/">{t(locale, "common", "navHome")}</Link>
              <Link className="app-text-accent" href="/about-us">{t(locale, "common", "navAbout")}</Link>
              <Link className="hover:text-white" href="/products">{t(locale, "common", "navProducts")}</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/menu" className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white">
                {t(locale, "common", "orderNow")}
              </Link>
            </div>
          </div>
        </header>

        <div className="relative mt-3 overflow-hidden rounded-3xl border border-white/10 app-bg-panel p-5 md:p-8 lg:mt-4 lg:p-10">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full app-bg-accent opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-8 h-56 w-56 rounded-full app-bg-accent opacity-10 blur-3xl" />

          <div className="relative z-10 grid w-full gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-semibold tracking-wide app-text-accent">
                {t(locale, "about", "badge")}
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl xl:text-6xl">
                {t(locale, "about", "title")}
              </h1>
              <p className="mt-5 max-w-2xl text-sm text-gray-300 md:text-base">
                {t(locale, "about", "subtitle")}
              </p>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {highlights.map((item) => (
                  <article key={item.title} className="app-bg-elevated rounded-2xl border border-white/10 p-4">
                    <h2 className="text-base font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 text-sm text-gray-300">{item.description}</p>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 app-bg-elevated p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">{t(locale, "about", "focusDailyTitle")}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 p-3">
                    <p className="text-sm font-medium text-white">{t(locale, "about", "focusQualityTitle")}</p>
                    <p className="mt-1 text-xs text-gray-300">{t(locale, "about", "focusQualityDesc")}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 p-3">
                    <p className="text-sm font-medium text-white">{t(locale, "about", "focusServiceTitle")}</p>
                    <p className="mt-1 text-xs text-gray-300">{t(locale, "about", "focusServiceDesc")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 self-start">
              <article className="app-bg-elevated rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">{t(locale, "about", "storyTitle")}</p>
                <p className="mt-3 text-sm text-gray-200">
                  {t(locale, "about", "storyBody")}
                </p>
              </article>

              <article className="app-bg-elevated rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">{t(locale, "about", "serviceInfoTitle")}</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-200">
                  <li>{t(locale, "about", "serviceLine1")}</li>
                  <li>{t(locale, "about", "serviceLine2")}</li>
                  <li>{t(locale, "about", "serviceLine3")}</li>
                  <li>{t(locale, "about", "serviceLine4")}</li>
                </ul>
              </article>

              <article className="app-bg-elevated rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">{t(locale, "about", "locationTitle")}</p>
                <p className="mt-3 text-sm text-gray-200">{t(locale, "about", "locationLine1")}</p>
                <p className="mt-1 text-sm text-gray-300">{t(locale, "about", "locationLine2")}</p>
                <p className="mt-1 text-sm text-gray-300">{t(locale, "about", "locationLine3")}</p>
                <p className="mt-1 text-sm text-gray-300">{t(locale, "about", "locationLine4")}</p>
              </article>

              <div className="flex flex-wrap gap-3">
                <Link href="/menu" className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white">
                  {t(locale, "about", "exploreMenu")}
                </Link>
                <Link href="/messages" className="app-hover-accent-soft rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-gray-200">
                  {t(locale, "about", "sendMessage")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
