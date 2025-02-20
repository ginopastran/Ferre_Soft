import { Skeleton } from "@/components/ui/skeleton";

export function FacturaSkeleton() {
  return (
    <div className="p-6 bg-white rounded-lg border shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 p-4">
          <div className="flex gap-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
