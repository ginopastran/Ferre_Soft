import { Skeleton } from "@/components/ui/skeleton";

export function RecentSalesSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className="ml-4 space-y-1">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
          <div className="ml-auto">
            <Skeleton className="h-4 w-[80px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
