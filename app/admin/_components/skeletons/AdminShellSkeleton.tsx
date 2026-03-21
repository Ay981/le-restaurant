import Skeleton from "@/components/ui/Skeleton";

export default function AdminShellSkeleton() {
  return (
    <main className="app-bg-main min-h-screen px-2 py-2 text-white md:px-3">
      <div className="w-full rounded-3xl border border-white/10 p-3 md:p-4">
        <div className="grid items-stretch gap-3 lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[72px_1fr]">
          <aside className="app-bg-panel rounded-2xl p-2">
            <div className="flex h-full flex-row items-center justify-between gap-2 lg:flex-col lg:py-2">
              <div className="flex items-center gap-2 lg:flex-col">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </aside>

          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
