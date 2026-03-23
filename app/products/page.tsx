import Link from "next/link";
import Image from "next/image";
import { dishes } from "@/lib/data";
import { formatCurrency } from "@/lib/currency";

export default function ProductsPage() {
  const menuItems = dishes.slice(0, 8);
  const stats = [
    { label: "Featured Dishes", value: `${menuItems.length}` },
    { label: "Popular Categories", value: "4" },
    { label: "Avg. Prep Window", value: "15-25 min" },
  ];

  return (
    <main className="app-bg-main min-h-screen text-white">
      <section className="w-full px-3 py-3 md:px-5 md:py-5 lg:px-6">
        <header className="app-bg-panel rounded-3xl border border-white/10 p-6 md:p-8 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="app-text-accent text-xs font-semibold tracking-[0.2em] uppercase">Products</p>
              <h1 className="mt-2 text-3xl font-semibold md:text-4xl lg:text-5xl">Signature dishes from our menu</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-300 md:text-base">Browse popular choices, compare prices quickly, and continue to checkout in one flow.</p>
            </div>
            <Link href="/menu" className="app-bg-accent rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
              Go to Full Menu
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <article key={item.label} className="app-bg-elevated rounded-xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
              </article>
            ))}
          </div>
        </header>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {menuItems.map((dish) => (
            <article key={dish.title} className="app-bg-panel rounded-2xl border border-white/10 p-3">
              <div className="h-32 overflow-hidden rounded-xl border border-white/10">
                <Image src={dish.image} alt={dish.title} width={360} height={180} className="h-full w-full object-cover" />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">{dish.title}</p>
              <p className="mt-1 text-xs text-gray-400">{dish.availability}</p>
              <p className="mt-2 text-sm font-medium text-gray-100">{formatCurrency(dish.price)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
