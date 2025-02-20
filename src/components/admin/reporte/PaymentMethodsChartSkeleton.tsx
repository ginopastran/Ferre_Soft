import { Skeleton } from "@/components/ui/skeleton";

export function PaymentMethodsChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <Skeleton className="w-[160px] h-[160px] rounded-full" />
      <div className="absolute right-4 bottom-4 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
  );
}
