import { settingsNavItems } from "../types";

export default function AdminSettingsPanel() {
  return (
    <section className="app-bg-panel rounded-2xl p-4">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="mt-4 space-y-2">
        {settingsNavItems.map((item) => {
          const isActive = item.label === "Products Management";

          return (
            <div
              key={item.label}
              className={`rounded-xl border px-3 py-3 ${
                isActive ? "app-bg-elevated app-border-accent border" : "border-white/10 bg-transparent"
              }`}
            >
              <p className={`text-sm font-medium ${isActive ? "app-text-accent" : "text-gray-200"}`}>
                {item.label}
              </p>
              <p className="mt-1 text-xs text-gray-400">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
