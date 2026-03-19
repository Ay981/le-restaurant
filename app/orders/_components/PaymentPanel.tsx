import TransactionUpload from "@/components/orders/TransactionUpload";

export function PaymentPanel() {
  return (
    <section className="p-5 xl:p-6">
      <h2 className="text-2xl font-semibold">Payment</h2>
      <p className="mt-1 text-sm text-gray-400">3 payment method available</p>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-200">Payment Method</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button className="app-bg-elevated rounded-xl border border-white/10 px-3 py-3 text-xs text-gray-100">
            Credit Card
          </button>
          <button className="rounded-xl border border-white/10 px-3 py-3 text-xs text-gray-300">Paypal</button>
          <button className="rounded-xl border border-white/10 px-3 py-3 text-xs text-gray-300">Cash</button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="text-sm text-gray-300">
          Cardholder Name
          <input
            className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100"
            defaultValue="Avi Ackerman"
          />
        </label>
        <label className="text-sm text-gray-300">
          Card Number
          <input
            className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100"
            defaultValue="2564 1421 0897 1244"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-300">
            Expiration Date
            <input
              className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100"
              defaultValue="02/2022"
            />
          </label>
          <label className="text-sm text-gray-300">
            CVV
            <input
              className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100"
              defaultValue="•••"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-300">
            Order Type
            <input
              className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100"
              defaultValue="Dine In"
            />
          </label>
          <label className="text-sm text-gray-300">
            Table no.
            <input
              className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100"
              defaultValue="140"
            />
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
  );
}
