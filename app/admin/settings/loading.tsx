import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-[72vh] w-full rounded-2xl" />
    </div>
  );
}
