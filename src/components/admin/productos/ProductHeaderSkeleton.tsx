import { Skeleton } from "@/components/ui/skeleton";

export function ProductHeaderSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Skeleton className="h-10 w-full max-w-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}
