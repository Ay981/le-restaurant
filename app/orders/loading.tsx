import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <Skeleton className="mb-4 h-6 w-40 rounded-md" />
        <div className="app-bg-panel grid overflow-hidden rounded-2xl border border-white/10 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-3 border-l border-white/10 p-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
