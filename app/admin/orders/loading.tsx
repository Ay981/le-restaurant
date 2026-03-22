import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <section className="app-bg-panel h-full rounded-2xl border border-white/10 p-4 md:p-6">
      <div className="space-y-2 border-b border-white/10 pb-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-white/10 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </section>
  );
}
