import Image from "next/image";
import Link from "next/link";
import TransactionUpload from "@/components/orders/TransactionUpload";
import { formatCurrency } from "@/lib/currency";
import { orderItems, orderSummary } from "@/lib/data";

export default function Page() {
  return (
    <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <span aria-hidden>←</span>
          Back to Dashboard
        </Link>

        <div className="app-bg-panel grid overflow-hidden rounded-2xl border border-white/10 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-white/10 p-5 xl:border-b-0 xl:border-r xl:border-white/10 xl:p-6">
            <h2 className="text-2xl font-semibold">Confirmation</h2>
            <p className="mt-1 text-sm text-gray-400">Orders {orderSummary.orderNumber}</p>

            <div className="mt-6 space-y-4">
              {orderItems.map((item) => (
                <div key={item.title} className="border-b border-white/10 pb-4 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-100">{item.shortTitle}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="app-bg-elevated flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs">
                      {item.quantity}
                    </div>
                    <p className="w-14 text-right text-sm text-gray-100">{formatCurrency(item.total)}</p>
                  </div>
                  <input
                    readOnly
                    value={item.note}
                    className="app-bg-elevated mt-3 h-9 w-full rounded-lg border border-white/10 px-3 text-xs text-gray-300"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>{formatCurrency(orderSummary.discount)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-base text-gray-100">
                <span>Sub total</span>
                <span>{formatCurrency(orderSummary.subtotal)}</span>
              </div>
            </div>
          </section>

          <section className="p-5 xl:p-6">
            <h2 className="text-2xl font-semibold">Payment</h2>
            <p className="mt-1 text-sm text-gray-400">3 payment method available</p>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-200">Payment Method</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button className="app-bg-elevated rounded-xl border border-white/10 px-3 py-3 text-xs text-gray-100">Credit Card</button>
                <button className="rounded-xl border border-white/10 px-3 py-3 text-xs text-gray-300">Paypal</button>
                <button className="rounded-xl border border-white/10 px-3 py-3 text-xs text-gray-300">Cash</button>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="text-sm text-gray-300">
                Cardholder Name
                <input className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100" defaultValue="Avi Ackerman" />
              </label>
              <label className="text-sm text-gray-300">
                Card Number
                <input className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100" defaultValue="2564 1421 0897 1244" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-gray-300">
                  Expiration Date
                  <input className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100" defaultValue="02/2022" />
                </label>
                <label className="text-sm text-gray-300">
                  CVV
                  <input className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100" defaultValue="•••" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-gray-300">
                  Order Type
                  <input className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100" defaultValue="Dine In" />
                </label>
                <label className="text-sm text-gray-300">
                  Table no.
                  <input className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100" defaultValue="140" />
                </label>
              </div>
            </div>

            <TransactionUpload />

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="app-hover-accent-soft rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-gray-200">
                Cancel
              </button>
              <button className="app-bg-accent rounded-xl px-4 py-3 text-sm font-semibold text-white">
                Confirm Payment
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}