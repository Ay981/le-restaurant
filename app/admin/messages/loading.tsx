export default function AdminMessagesLoading() {
  return (
    <section className="app-bg-panel h-full rounded-2xl border border-white/10 p-4 md:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-56 rounded bg-white/10" />
        <div className="h-4 w-96 rounded bg-white/10" />
        <div className="h-30 rounded-xl bg-white/10" />
        <div className="h-30 rounded-xl bg-white/10" />
      </div>
    </section>
  );
}
