type OrderTypeTabsProps = {
  orderTypes: string[];
  activeType: string;
  onChange: (type: string) => void;
};

export default function OrderTypeTabs({ orderTypes, activeType, onChange }: OrderTypeTabsProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {orderTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            activeType === type
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
