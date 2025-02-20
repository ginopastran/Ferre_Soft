import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
  return (
    <div className="w-full h-[350px] flex flex-col">
      <div className="flex-1 grid grid-cols-12 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="col-span-1 flex items-end">
            <Skeleton className="w-full h-[${Math.random() * 100}%] min-h-[40px]" />
          </div>
        ))}
      </div>
      <div className="h-8 flex justify-between px-4 mt-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="w-8 h-4" />
        ))}
      </div>
    </div>
  );
}
