import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductsGridSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="w-full">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-20 w-20 rounded-md" />
            </div>
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}
