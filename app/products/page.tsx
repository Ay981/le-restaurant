import Link from "next/link";
import Image from "next/image";
import { dishes } from "@/lib/data";
import { formatCurrency } from "@/lib/currency";

export default function ProductsPage() {
  const menuItems = dishes.slice(0, 8);

  return (
    <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="app-bg-panel rounded-3xl border border-white/10 p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="app-text-accent text-xs font-semibold tracking-[0.2em] uppercase">Products</p>
              <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Signature dishes from our menu</h1>
              <p className="mt-2 text-sm text-gray-300">Browse popular choices and continue to ordering.</p>
            </div>
            <Link href="/menu" className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white">
              Go to Full Menu
            </Link>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
