type OrderTypeTabsProps = {
  orderTypes: string[];
};

export default function OrderTypeTabs({ orderTypes }: OrderTypeTabsProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {orderTypes.map((type, index) => (
        <button
          key={type}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            index === 0
              ? "app-border-accent app-bg-accent text-white"
              : "border-white/10 bg-transparent app-text-accent"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
